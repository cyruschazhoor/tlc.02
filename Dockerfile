# Stage 1: Build the React SPA
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Build the C# .NET Minimal API Backend
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS backend-builder
WORKDIR /src
COPY ["LearningCollective.csproj", "./"]
RUN dotnet restore "LearningCollective.csproj"
COPY . .
RUN dotnet publish "LearningCollective.csproj" -c Release -o /app/publish

# Stage 3: Create the production image running on .NET 8.0 Runstack
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 80
EXPOSE 443

# Copy compiled C# binaries
COPY --from=backend-builder /app/publish .

# Copy built React static assets into wwwroot (for ASP.NET Core UseStaticFiles serving)
COPY --from=frontend-builder /app/dist ./wwwroot

# Run the ASP.NET Core application
ENTRYPOINT ["dotnet", "LearningCollective.dll"]
