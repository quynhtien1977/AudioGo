using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Server.Data;
using Server.Hubs;
using Server.Repositories;
using Server.Repositories.Interfaces;
using Server.Services;
using Server.Services.Interfaces;
using Server.Queues;

var builder = WebApplication.CreateBuilder(args);

// ── Load .env (secrets không commit lên git) ──────────────────────────
var envPath = Path.Combine(builder.Environment.ContentRootPath, ".env");
if (File.Exists(envPath))
{
    DotNetEnv.Env.Load(envPath);
    builder.Configuration.AddEnvironmentVariables();
}

// ── CORS ──────────────────────────────────────────────────────────────
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                     ?? ["http://localhost:5173"];

builder.Services.AddHttpClient();

builder.Services.AddCors(opt =>
{
    opt.AddPolicy("MobilePolicy", p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
    opt.AddPolicy("WebCmsPolicy", p => p.WithOrigins(allowedOrigins)
                                        .AllowAnyHeader()
                                        .AllowAnyMethod()
                                        .AllowCredentials()); // ✅ REQUIRED FOR SIGNALR WEBSOCKET
    // Webhook từ SePay/MoMo server gọi vào — không cần CORS restrict
    opt.AddPolicy("PaymentWebhookPolicy", p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

// ── Database ──────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── JWT Auth ──────────────────────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = builder.Configuration["Jwt:Issuer"],
            ValidAudience            = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };

        // ✅ REQUIRED: SignalR WebSocket không gửi được Authorization header,
        // nên token được đính kèm qua ?access_token=<jwt> trong URL.
        opt.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var token = ctx.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(token) &&
                    ctx.Request.Path.StartsWithSegments("/deviceHub"))
                {
                    ctx.Token = token;
                }
                return Task.CompletedTask;
            }
        };
    });
builder.Services.AddAuthorization();

// ── Services & Repositories ───────────────────────────────────────────
builder.Services.AddSignalR(); // ✅ ADD SIGNALR
builder.Services.AddSingleton<IDevicePresenceService, DevicePresenceService>(); // ✅ IN-MEMORY PRESENCE
builder.Services.AddScoped<IPoiRepository, PoiRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<ITourRepository, TourRepository>();
builder.Services.AddScoped<IListenHistoryRepository, ListenHistoryRepository>();
builder.Services.AddScoped<ILocationLogRepository, LocationLogRepository>();
builder.Services.AddScoped<IArticleRepository, ArticleRepository>();
builder.Services.AddScoped<IArticleTranslationService, ArticleTranslationService>();
builder.Services.AddScoped<AuthService>();

// ── Background Queues ────────────────────────────────────────────────
// Location log queue: RabbitMQ external broker (docker-compose up -d)
// Cấu hình: appsettings.json -> "RabbitMQ": { "Host", "Port", "User", "Password" }
builder.Services.AddSingleton<ILocationQueue, RabbitMQLocationQueue>();
builder.Services.AddSingleton<IDisposable>(sp =>
    (IDisposable)sp.GetRequiredService<ILocationQueue>()); // Đảm bảo Dispose được gọi khi shutdown
builder.Services.AddHostedService<LocationQueueHostedService>();

builder.Services.AddSingleton<IListenHistoryQueue, ListenHistoryQueue>();
builder.Services.AddHostedService<ListenHistoryHostedService>();

builder.Services.AddSingleton<IContentPipelineQueue, ContentPipelineQueue>();
builder.Services.AddHostedService<ContentPipelineHostedService>();
builder.Services.AddSingleton<IBlobStorageService, BlobStorageService>();
builder.Services.AddSingleton<ITranslationService, TranslationService>();
builder.Services.AddSingleton<ITtsService, TtsService>();
builder.Services.AddScoped<IContentPipelineService, ContentPipelineService>();
builder.Services.AddScoped<ICmsPoiService, CmsPoiService>();
builder.Services.AddScoped<IPoiRequestService, PoiRequestService>();
builder.Services.AddScoped<IAccountRepository, AccountRepository>();
builder.Services.AddHttpClient<IEmailService, ResendEmailService>();
builder.Services.AddHttpContextAccessor();

// ── Subscription & Payment ────────────────────────────────────────────
builder.Services.AddScoped<SubscriptionService>();
builder.Services.AddScoped<PaymentWebhookService>();
builder.Services.AddHostedService<PaymentCleanupService>(); // Tự động expire PENDING tx sau 30 phút
builder.Services.AddHostedService<DataRetentionService>(); // Tự động xóa dữ liệu định vị (30 ngày) và lịch sử nghe (90 ngày)


// ── Rate Limiting — chống brute-force và spam ───────────────────────
// AuthPolicy   : 10 req / phút mỗi IP  — áp dụng cho /api/auth/*
// CmsWritePolicy: 30 req / phút mỗi userId — áp dụng cho CMS POST/PUT/DELETE
// UploadPolicy : 10 req / phút mỗi userId — áp dụng cho upload media
builder.Services.AddRateLimiter(opts =>
{
    // Auth: rate limit theo IP (user chưa đăng nhập)
    opts.AddPolicy("auth", ctx =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                Window            = TimeSpan.FromMinutes(1),
                PermitLimit       = 10,
                QueueLimit        = 0,
                AutoReplenishment = true
            }));

    // CMS Write: rate limit theo userId (đã đăng nhập), fallback về IP
    opts.AddPolicy("cmsWrite", ctx =>
    {
        var userId = ctx.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                     ?? ctx.Connection.RemoteIpAddress?.ToString()
                     ?? "anon";
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: $"cmsWrite:{userId}",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                Window            = TimeSpan.FromMinutes(1),
                PermitLimit       = 30,
                QueueLimit        = 0,
                AutoReplenishment = true
            });
    });

    // Upload: giới hạn chặt hơn để tránh abuse storage
    opts.AddPolicy("upload", ctx =>
    {
        var userId = ctx.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                     ?? ctx.Connection.RemoteIpAddress?.ToString()
                     ?? "anon";
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: $"upload:{userId}",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                Window            = TimeSpan.FromMinutes(1),
                PermitLimit       = 10,
                QueueLimit        = 0,
                AutoReplenishment = true
            });
    });

    opts.RejectionStatusCode = 429; // Too Many Requests
    opts.OnRejected = async (ctx, _) =>
    {
        ctx.HttpContext.Response.Headers["Retry-After"] = "60";
        await ctx.HttpContext.Response.WriteAsync(
            "{\"error\":\"Quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.\"}");
    };
});

// ── Controllers & OpenAPI ─────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddHealthChecks(); // ✅ REQUIRED: Render/Azure health probe

// ─────────────────────────────────────────────────────────────────────
var app = builder.Build();

// ── HTTP Security Headers ────────────────────────────────────────────
// Thêm các header bảo mật cơ bản vào mọi response.
// Không ảnh hưởng đến CORS hay SPA — chỉ là meta-headers phòng thủ.
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"]         = "DENY";
    context.Response.Headers["X-XSS-Protection"]        = "1; mode=block";
    context.Response.Headers["Referrer-Policy"]          = "strict-origin-when-cross-origin";
    context.Response.Headers["Permissions-Policy"]       = "geolocation=(), microphone=(), camera=()";
    await next();
});

app.MapOpenApi();           // /openapi/v1.json — dùng cho React generate TS types
app.UseStaticFiles();       // serve /uploads/... cho audio + image
app.UseRouting();           // ✅ UseRouting PHẢI trước UseCors khi dùng [EnableCors]
app.UseCors("WebCmsPolicy"); // ✅ CORS sau UseRouting, trước UseAuthentication
app.UseRateLimiter();       // ✅ Rate Limiting — sau CORS, trước Auth
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health"); // ✅ Render/Azure health probe endpoint
app.MapHub<DeviceHub>("/deviceHub")     // ✅ MAP SIGNALR HUB
   .RequireCors("WebCmsPolicy");         // ✅ HUB CẦN EXPLICIT CORS — [Authorize] không đủ

app.Run();
