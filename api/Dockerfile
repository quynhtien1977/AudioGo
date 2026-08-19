# ────────────────────────────────────────────────────────────────────
# Stage 1: Build
# Dùng SDK image (lớn) để restore + compile
# ────────────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy file project trước để tận dụng Docker layer cache
# (chỉ restore lại khi .csproj thay đổi)
COPY AudioGo.sln ./
COPY api/Api.csproj ./api/
COPY shared/Shared.csproj ./shared/

RUN dotnet restore api/Api.csproj

# Copy toàn bộ source code
COPY api/ ./api/
COPY shared/ ./shared/

# Publish ra /app/publish (self-contained = false, dùng runtime image)
WORKDIR /src/api
RUN dotnet publish Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

# ────────────────────────────────────────────────────────────────────
# Stage 2: Runtime
# Dùng ASP.NET runtime image (nhỏ hơn SDK ~3x)
# ────────────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Azure Cognitive Services Speech SDK cần các thư viện audio trên Linux
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgssapi-krb5-2 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

# Render inject PORT env var tự động — app phải lắng nghe đúng port
ENV ASPNETCORE_URLS=http://+:${PORT:-8080}
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

ENTRYPOINT ["dotnet", "Api.dll"]
