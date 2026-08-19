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
    -o /app/publish

# ────────────────────────────────────────────────────────────────────
# Stage 2: Runtime
# Dùng ASP.NET runtime image (nhỏ hơn SDK ~3x)
# ────────────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Azure Cognitive Services Speech SDK cần các thư viện audio trên Linux
# Ubuntu 24.04 (Noble): libasound2 đã đổi tên thành libasound2t64
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgssapi-krb5-2 \
    libasound2t64 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

# ASPNETCORE_ENVIRONMENT mặc định Production
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

# Render inject PORT env var lúc runtime — dùng shell để expand đúng
# sh -c đảm bảo ${PORT:-8080} được evaluate khi container start, không phải lúc build
ENTRYPOINT ["sh", "-c", "exec dotnet Api.dll --urls http://+:${PORT:-8080}"]
