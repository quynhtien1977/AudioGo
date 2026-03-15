using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Server.Data;
using Server.Repositories;
using Server.Repositories.Interfaces;
using Server.Services;

var builder = WebApplication.CreateBuilder(args);

// ── CORS ──────────────────────────────────────────────────────────────
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                     ?? ["http://localhost:5173"];
builder.Services.AddCors(opt =>
{
    opt.AddPolicy("MobilePolicy", p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
    opt.AddPolicy("WebCmsPolicy", p => p.WithOrigins(allowedOrigins)
                                        .AllowAnyHeader().AllowAnyMethod().AllowCredentials());
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
builder.Services.AddScoped<IPoiRepository, PoiRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<ITourRepository, TourRepository>();
builder.Services.AddScoped<IListenHistoryRepository, ListenHistoryRepository>();
builder.Services.AddScoped<ILocationLogRepository, LocationLogRepository>();
builder.Services.AddScoped<AuthService>();

// ── Controllers & OpenAPI ─────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// ─────────────────────────────────────────────────────────────────────
var app = builder.Build();

app.MapOpenApi();           // /openapi/v1.json — dùng cho React generate TS types
app.UseStaticFiles();       // serve /uploads/... cho audio + image
app.UseCors("WebCmsPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
