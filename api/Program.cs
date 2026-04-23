using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Server.Data;
using Server.Hubs;
using Server.Repositories;
using Server.Repositories.Interfaces;
using Server.Services;
using Server.Services.Interfaces;

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
builder.Services.AddCors(opt =>
{
    opt.AddPolicy("MobilePolicy", p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
    opt.AddPolicy("WebCmsPolicy", p => p.WithOrigins(allowedOrigins)
                                        .AllowAnyHeader()
                                        .AllowAnyMethod()
                                        .AllowCredentials()); // ✅ REQUIRED FOR SIGNALR WEBSOCKET
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
    });
builder.Services.AddAuthorization();

// ── Services & Repositories ───────────────────────────────────────────
builder.Services.AddSignalR(); // ✅ ADD SIGNALR
builder.Services.AddScoped<IPoiRepository, PoiRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<ITourRepository, TourRepository>();
builder.Services.AddScoped<IListenHistoryRepository, ListenHistoryRepository>();
builder.Services.AddScoped<ILocationLogRepository, LocationLogRepository>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddSingleton<IBlobStorageService, BlobStorageService>();
builder.Services.AddSingleton<ITranslationService, TranslationService>();
builder.Services.AddSingleton<ITtsService, TtsService>();
builder.Services.AddScoped<IContentPipelineService, ContentPipelineService>();
builder.Services.AddScoped<ICmsPoiService, CmsPoiService>();
builder.Services.AddScoped<IPoiRequestService, PoiRequestService>();
builder.Services.AddScoped<IAccountRepository, AccountRepository>();
builder.Services.AddHttpContextAccessor();

// ── Controllers & OpenAPI ─────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// ─────────────────────────────────────────────────────────────────────
var app = builder.Build();

app.MapOpenApi();           // /openapi/v1.json — dùng cho React generate TS types
app.UseStaticFiles();       // serve /uploads/... cho audio + image
app.UseCors("WebCmsPolicy"); // ✅ CORS MUST BE BEFORE UseRouting
app.UseRouting();           // ✅ REQUIRED FOR SIGNALR
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<DeviceHub>("/deviceHub"); // ✅ MAP SIGNALR HUB

app.Run();
