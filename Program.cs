/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

using System;
using System.IO;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Configure JSON formatting with camelCase and support string enums
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

var app = builder.Build();

// Enable CORS
app.UseCors();

// Initialize the Database Manager
DatabaseManager.Initialize();

// ============================================================================
// API ENDPOINTS
// ============================================================================

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));

// --- AUTHENTICATION ---

app.MapPost("/api/auth/signup", async (HttpContext context) =>
{
    try
    {
        using var document = await JsonDocument.ParseAsync(context.Request.Body);
        var root = document.RootElement;
        
        var email = root.GetProperty("email").GetString();
        var fullName = root.GetProperty("fullName").GetString();
        var role = root.TryGetProperty("role", out var rProp) ? rProp.GetString() : "student";

        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(fullName))
        {
            return Results.BadRequest(new { error = "Email and Full Name are required." });
        }

        var user = DatabaseManager.SignUpUser(email, fullName, role ?? "student");
        return Results.Ok(user);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.MapPost("/api/auth/signin", async (HttpContext context) =>
{
    try
    {
        using var document = await JsonDocument.ParseAsync(context.Request.Body);
        var root = document.RootElement;
        
        var email = root.GetProperty("email").GetString();

        if (string.IsNullOrEmpty(email))
        {
            return Results.BadRequest(new { error = "Email is required." });
        }

        var user = DatabaseManager.SignInUser(email);
        if (user == null)
        {
            return Results.NotFound(new { error = "User not found with this email. Please Sign Up!" });
        }

        return Results.Ok(user);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.MapPut("/api/users/profile", async (HttpContext context) =>
{
    try
    {
        using var document = await JsonDocument.ParseAsync(context.Request.Body);
        var root = document.RootElement;
        
        var id = root.GetProperty("id").GetString();
        if (string.IsNullOrEmpty(id))
        {
            return Results.BadRequest(new { error = "User ID is required." });
        }

        var updates = new Dictionary<string, string>();
        if (root.TryGetProperty("fullName", out var fnProp)) updates["fullName"] = fnProp.GetString() ?? "";
        if (root.TryGetProperty("avatarUrl", out var avProp)) updates["avatarUrl"] = avProp.GetString() ?? "";

        var user = DatabaseManager.UpdateProfile(id, updates);
        if (user == null)
        {
            return Results.NotFound(new { error = "User not found." });
        }

        return Results.Ok(user);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

// --- TUTORS ---

app.MapGet("/api/tutors", () =>
{
    try
    {
        var tutors = DatabaseManager.GetTutors();
        return Results.Ok(tutors);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

// --- SESSIONS ---

app.MapGet("/api/sessions/{userId}", (string userId) =>
{
    try
    {
        var sessions = DatabaseManager.GetSessions(userId);
        return Results.Ok(sessions);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.MapPost("/api/sessions/book", async (HttpContext context) =>
{
    try
    {
        var session = await JsonSerializer.DeserializeAsync<Session>(context.Request.Body, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        if (session == null || string.IsNullOrEmpty(session.StudentId) || string.IsNullOrEmpty(session.TutorId))
        {
            return Results.BadRequest(new { error = "Incomplete booking details." });
        }

        var bookedSession = DatabaseManager.BookSession(session);
        return Results.Ok(bookedSession);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.MapPost("/api/sessions/pay", async (HttpContext context) =>
{
    try
    {
        using var document = await JsonDocument.ParseAsync(context.Request.Body);
        var root = document.RootElement;
        var sessionId = root.GetProperty("sessionId").GetString();

        if (string.IsNullOrEmpty(sessionId))
        {
            return Results.BadRequest(new { error = "Session ID is required." });
        }

        var session = DatabaseManager.PaySession(sessionId);
        if (session == null)
        {
            return Results.NotFound(new { error = "Session not found." });
        }

        return Results.Ok(session);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.MapPost("/api/sessions/complete", async (HttpContext context) =>
{
    try
    {
        using var document = await JsonDocument.ParseAsync(context.Request.Body);
        var root = document.RootElement;
        var sessionId = root.GetProperty("sessionId").GetString();

        if (string.IsNullOrEmpty(sessionId))
        {
            return Results.BadRequest(new { error = "Session ID is required." });
        }

        var session = DatabaseManager.CompleteSession(sessionId);
        if (session == null)
        {
            return Results.NotFound(new { error = "Session not found." });
        }

        return Results.Ok(session);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.MapPost("/api/sessions/rate", async (HttpContext context) =>
{
    try
    {
        using var document = await JsonDocument.ParseAsync(context.Request.Body);
        var root = document.RootElement;
        var sessionId = root.GetProperty("sessionId").GetString();
        var ratingGiven = root.GetProperty("ratingGiven").GetInt32();

        if (string.IsNullOrEmpty(sessionId))
        {
            return Results.BadRequest(new { error = "Session ID is required." });
        }

        var session = DatabaseManager.RateSession(sessionId, ratingGiven);
        if (session == null)
        {
            return Results.NotFound(new { error = "Session not found." });
        }

        return Results.Ok(session);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

// --- QUESTIONS BOARD ---

app.MapGet("/api/questions", () =>
{
    try
    {
        var questions = DatabaseManager.GetQuestions();
        return Results.Ok(questions);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.MapPost("/api/questions", async (HttpContext context) =>
{
    try
    {
        using var document = await JsonDocument.ParseAsync(context.Request.Body);
        var root = document.RootElement;

        var studentId = root.GetProperty("studentId").GetString();
        var studentName = root.GetProperty("studentName").GetString();
        var title = root.GetProperty("title").GetString();
        var content = root.GetProperty("content").GetString();
        var subject = root.GetProperty("subject").GetString();

        if (string.IsNullOrEmpty(studentId) || string.IsNullOrEmpty(studentName) || string.IsNullOrEmpty(title) || string.IsNullOrEmpty(content) || string.IsNullOrEmpty(subject))
        {
            return Results.BadRequest(new { error = "All question details are required." });
        }

        var question = DatabaseManager.AddQuestion(studentId, studentName, title, content, subject);
        
        // Background automation: trigger tutor replies in the background simulation
        _ = Task.Run(async () =>
        {
            await Task.Delay(4000);
            DatabaseManager.SimulateTutorReply(question.Id, question.Subject);
        });

        return Results.Ok(question);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.MapPost("/api/questions/{questionId}/reply", async (string questionId, HttpContext context) =>
{
    try
    {
        using var document = await JsonDocument.ParseAsync(context.Request.Body);
        var root = document.RootElement;

        var authorName = root.GetProperty("authorName").GetString();
        var authorRole = root.GetProperty("authorRole").GetString();
        var content = root.GetProperty("content").GetString();

        if (string.IsNullOrEmpty(authorName) || string.IsNullOrEmpty(authorRole) || string.IsNullOrEmpty(content))
        {
            return Results.BadRequest(new { error = "Author details and content are required." });
        }

        var reply = DatabaseManager.AddReply(questionId, authorName, authorRole, content);
        if (reply == null)
        {
            return Results.NotFound(new { error = "Question not found." });
        }

        return Results.Ok(reply);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.MapPost("/api/questions/{questionId}/like", (string questionId) =>
{
    try
    {
        var likes = DatabaseManager.LikeQuestion(questionId);
        if (likes == -1)
        {
            return Results.NotFound(new { error = "Question not found." });
        }

        return Results.Ok(new { likes });
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

// --- NOTIFICATIONS ---

app.MapGet("/api/notifications/{userId}", (string userId) =>
{
    try
    {
        var notifications = DatabaseManager.GetNotifications(userId);
        return Results.Ok(notifications);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.MapPost("/api/notifications/mark-read", async (HttpContext context) =>
{
    try
    {
        using var document = await JsonDocument.ParseAsync(context.Request.Body);
        var root = document.RootElement;

        string? userId = null;
        if (root.TryGetProperty("userId", out var uProp)) userId = uProp.GetString();

        string? notificationId = null;
        if (root.TryGetProperty("notificationId", out var nProp)) notificationId = nProp.GetString();

        if (string.IsNullOrEmpty(userId) && string.IsNullOrEmpty(notificationId))
        {
            return Results.BadRequest(new { error = "Either User ID or Notification ID is required." });
        }

        DatabaseManager.MarkNotificationsRead(userId, notificationId);
        return Results.Ok(new { success = true });
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.MapPost("/api/notifications/add", async (HttpContext context) =>
{
    try
    {
        using var document = await JsonDocument.ParseAsync(context.Request.Body);
        var root = document.RootElement;

        var userId = root.GetProperty("userId").GetString();
        var title = root.GetProperty("title").GetString();
        var message = root.GetProperty("message").GetString();
        var type = root.GetProperty("type").GetString();

        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(title) || string.IsNullOrEmpty(message) || string.IsNullOrEmpty(type))
        {
            return Results.BadRequest(new { error = "All notification details are required." });
        }

        var notification = DatabaseManager.AddNotification(userId, title, message, type);
        return Results.Ok(notification);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

// ============================================================================
// STATIC FILE SERVING (React SPA Hosting)
// ============================================================================

app.UseDefaultFiles();
app.UseStaticFiles();
app.MapFallbackToFile("index.html");

// Run Application
app.Run();

// ============================================================================
// DATA MODELS
// ============================================================================

public class User
{
    public string Id { get; set; } = "";
    public string Email { get; set; } = "";
    public string FullName { get; set; } = "";
    public string Role { get; set; } = "student";
    public string? AvatarUrl { get; set; }
    public string CreatedAt { get; set; } = "";
}

public class Tutor
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Avatar { get; set; } = "";
    public string Bio { get; set; } = "";
    public string[] Subjects { get; set; } = Array.Empty<string>();
    public double Rating { get; set; } = 5.0;
    public int ReviewsCount { get; set; } = 0;
    public int RatePerHour { get; set; } = 30;
    public Dictionary<string, string[]> Availability { get; set; } = new();
}

public class Session
{
    public string Id { get; set; } = "";
    public string StudentId { get; set; } = "";
    public string StudentName { get; set; } = "";
    public string TutorId { get; set; } = "";
    public string TutorName { get; set; } = "";
    public string? TutorAvatar { get; set; }
    public string Date { get; set; } = "";
    public string TimeSlot { get; set; } = "";
    public string Subject { get; set; } = "";
    public string Status { get; set; } = "pending";
    public string PaymentStatus { get; set; } = "unpaid";
    public double Amount { get; set; }
    public int? RatingGiven { get; set; }
    public string CreatedAt { get; set; } = "";
}

public class Reply
{
    public string Id { get; set; } = "";
    public string AuthorName { get; set; } = "";
    public string AuthorRole { get; set; } = "student";
    public string Content { get; set; } = "";
    public string CreatedAt { get; set; } = "";
}

public class Question
{
    public string Id { get; set; } = "";
    public string StudentId { get; set; } = "";
    public string StudentName { get; set; } = "";
    public string Title { get; set; } = "";
    public string Content { get; set; } = "";
    public string Subject { get; set; } = "";
    public List<Reply> Replies { get; set; } = new();
    public int Likes { get; set; } = 0;
    public string CreatedAt { get; set; } = "";
}

public class Notification
{
    public string Id { get; set; } = "";
    public string UserId { get; set; } = "";
    public string Title { get; set; } = "";
    public string Message { get; set; } = "";
    public string Type { get; set; } = "system";
    public bool Read { get; set; } = false;
    public string CreatedAt { get; set; } = "";
}

// ============================================================================
// DURABLE DATABASE MANAGER (Postgres SQL + Local JSON DB Fallback)
// ============================================================================

public static class DatabaseManager
{
    private static string? _connectionString;
    private static bool _usePostgres = false;
    private static readonly string FallbackDbPath = Path.Combine(Directory.GetCurrentDirectory(), "db_fallback.json");

    public static void Initialize()
    {
        _connectionString = GetConnectionString();
        if (!string.IsNullOrEmpty(_connectionString))
        {
            Console.WriteLine("PostgreSQL Connection String detected.");
            try
            {
                using var conn = new NpgsqlConnection(_connectionString);
                conn.Open();
                _usePostgres = true;
                Console.WriteLine("PostgreSQL connected successfully!");
                CreateTables(conn);
                SeedData(conn);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"PostgreSQL connection failed: {ex.Message}. Falling back to Local JSON DB.");
                _usePostgres = false;
            }
        }
        else
        {
            Console.WriteLine("No PostgreSQL configuration found. Defaulting to Local JSON DB.");
        }

        if (!_usePostgres)
        {
            InitializeJsonDb();
        }
    }

    private static string? GetConnectionString()
    {
        var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
        if (!string.IsNullOrEmpty(databaseUrl))
        {
            try
            {
                var uri = new Uri(databaseUrl);
                var userInfo = uri.UserInfo.Split(':');
                var user = userInfo[0];
                var password = userInfo.Length > 1 ? userInfo[1] : "";
                var host = uri.Host;
                var port = uri.Port > 0 ? uri.Port : 5432;
                var database = uri.AbsolutePath.TrimStart('/');
                
                var sslMode = databaseUrl.Contains("azure") || databaseUrl.Contains("cockroach") || databaseUrl.Contains("neon") ? "Require" : "Prefer";
                return $"Host={host};Port={port};Username={user};Password={password};Database={database};SSL Mode={sslMode};Trust Server Certificate=true;";
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error parsing DATABASE_URL: {ex.Message}");
            }
        }

        var pgHost = Environment.GetEnvironmentVariable("PGHOST");
        if (!string.IsNullOrEmpty(pgHost))
        {
            var pgPort = Environment.GetEnvironmentVariable("PGPORT") ?? "5432";
            var pgUser = Environment.GetEnvironmentVariable("PGUSER");
            var pgPassword = Environment.GetEnvironmentVariable("PGPASSWORD");
            var pgDatabase = Environment.GetEnvironmentVariable("PGDATABASE");
            return $"Host={pgHost};Port={pgPort};Username={pgUser};Password={pgPassword};Database={pgDatabase};SSL Mode=Prefer;Trust Server Certificate=true;";
        }

        return null;
    }

    private static void CreateTables(NpgsqlConnection conn)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(100) PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                fullName VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'student',
                avatarUrl TEXT,
                createdAt VARCHAR(100) NOT NULL
            );

            CREATE TABLE IF NOT EXISTS tutors (
                id VARCHAR(100) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                avatar TEXT,
                bio TEXT,
                subjects JSONB NOT NULL,
                rating NUMERIC(3,2) DEFAULT 5.0,
                reviewsCount INTEGER DEFAULT 0,
                ratePerHour INTEGER DEFAULT 30,
                availability JSONB NOT NULL,
                createdAt VARCHAR(100)
            );

            CREATE TABLE IF NOT EXISTS sessions (
                id VARCHAR(100) PRIMARY KEY,
                studentId VARCHAR(100) NOT NULL,
                studentName VARCHAR(255) NOT NULL,
                tutorId VARCHAR(100) NOT NULL,
                tutorName VARCHAR(255) NOT NULL,
                tutorAvatar TEXT,
                subject VARCHAR(100) NOT NULL,
                date VARCHAR(100) NOT NULL,
                timeSlot VARCHAR(100) NOT NULL,
                status VARCHAR(50) NOT NULL,
                paymentStatus VARCHAR(50) NOT NULL,
                amount NUMERIC(10,2) NOT NULL,
                ratingGiven INTEGER,
                createdAt VARCHAR(100) NOT NULL
            );

            CREATE TABLE IF NOT EXISTS questions (
                id VARCHAR(100) PRIMARY KEY,
                studentId VARCHAR(100) NOT NULL,
                studentName VARCHAR(255) NOT NULL,
                title VARCHAR(512) NOT NULL,
                content TEXT NOT NULL,
                subject VARCHAR(100) NOT NULL,
                likes INTEGER DEFAULT 0,
                replies JSONB DEFAULT '[]'::jsonb,
                createdAt VARCHAR(100) NOT NULL
            );

            CREATE TABLE IF NOT EXISTS notifications (
                id VARCHAR(100) PRIMARY KEY,
                userId VARCHAR(100) NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(50) NOT NULL,
                read BOOLEAN DEFAULT false,
                createdAt VARCHAR(100) NOT NULL
            );
        ";
        cmd.ExecuteNonQuery();
    }

    private static readonly List<Tutor> InitialTutors = new()
    {
        new Tutor {
            Id = "tutor-1",
            Name = "Maya Lin",
            Avatar = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
            Bio = "Hi, I am Maya! I specialize in high-school mathematics, chemistry, and biology. I love making complex concepts feel intuitive using sketches and real-world analogies. Let's succeed together!",
            Subjects = new[] { "Algebra", "Calculus", "Chemistry", "Biology" },
            Rating = 4.9,
            ReviewsCount = 38,
            RatePerHour = 45,
            Availability = new Dictionary<string, string[]> {
                { "Monday", new[] { "09:00", "11:00", "14:00", "16:00" } },
                { "Wednesday", new[] { "09:00", "11:00", "15:00", "17:00" } },
                { "Friday", new[] { "10:00", "13:00", "14:00", "16:00" } }
            }
        },
        new Tutor {
            Id = "tutor-2",
            Name = "Dr. Alan Chen",
            Avatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
            Bio = "Ph.D. in Physics. I have over 8 years of experience tutoring AP Physics, College Mechanics, and advanced statistics. I focus on conceptual understanding and problem-solving strategies.",
            Subjects = new[] { "Physics", "AP Physics", "Statistics", "Geometry" },
            Rating = 5.0,
            ReviewsCount = 52,
            RatePerHour = 60,
            Availability = new Dictionary<string, string[]> {
                { "Tuesday", new[] { "13:00", "14:00", "15:00", "18:00" } },
                { "Thursday", new[] { "13:00", "15:00", "16:00", "19:00" } },
                { "Saturday", new[] { "09:00", "10:00", "11:00", "14:00" } }
            }
        },
        new Tutor {
            Id = "tutor-3",
            Name = "Chloe Bennett",
            Avatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            Bio = "Literature enthusiast and college admissions coach. I assist students with SAT/ACT English prep, creative writing, and drafting standout college application essays that tell your unique story.",
            Subjects = new[] { "English Literature", "College Essays", "SAT Prep", "History" },
            Rating = 4.8,
            ReviewsCount = 29,
            RatePerHour = 40,
            Availability = new Dictionary<string, string[]> {
                { "Monday", new[] { "13:00", "14:00", "15:00", "16:00" } },
                { "Tuesday", new[] { "10:00", "11:00", "14:00", "15:00" } },
                { "Thursday", new[] { "10:00", "11:00", "15:00", "16:00" } }
            }
        },
        new Tutor {
            Id = "tutor-4",
            Name = "James Wilson",
            Avatar = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
            Bio = "Computer Science major and programming coach. I tutor introductory coding in Python, Java, and JavaScript/TypeScript. We will build real mini-projects to reinforce variables, loops, and OOP!",
            Subjects = new[] { "Python", "Java", "Web Development", "Computer Science" },
            Rating = 4.9,
            ReviewsCount = 41,
            RatePerHour = 50,
            Availability = new Dictionary<string, string[]> {
                { "Wednesday", new[] { "14:00", "15:00", "16:00", "18:00" } },
                { "Friday", new[] { "14:00", "15:00", "16:00", "17:00" } },
                { "Saturday", new[] { "10:00", "12:00", "13:00", "15:00" } }
            }
        }
    };

    private static readonly List<Question> InitialQuestions = new()
    {
        new Question {
            Id = "q-1",
            StudentId = "student-mock-1",
            StudentName = "Sarah Jenkins",
            Title = "Stuck on integrating quotients in Calculus",
            Content = "Hi! I am working on some AP Calculus homework and I keep getting confused when integrating expressions like ∫(2x)/(x^2 + 1) dx. Is there a simple rule or substitution method I should always look for first?",
            Subject = "Calculus",
            Likes = 8,
            CreatedAt = DateTime.UtcNow.AddDays(-1).ToString("o"),
            Replies = new List<Reply> {
                new Reply {
                    Id = "r-1",
                    AuthorName = "Maya Lin",
                    AuthorRole = "tutor",
                    Content = "Great question, Sarah! For this specific integral, look at the relation between the numerator and the denominator. The derivative of the denominator (x^2 + 1) is 2x, which is exactly the numerator! This is a classic setup for u-substitution. Let u = x^2 + 1, so du = 2x dx. The integral becomes ∫(1/u) du, which is ln|u| + C. So your answer is ln(x^2 + 1) + C! In general, always check if the numerator is a scalar multiple of the derivative of the denominator.",
                    CreatedAt = DateTime.UtcNow.AddHours(-22).ToString("o")
                }
            }
        },
        new Question {
            Id = "q-2",
            StudentId = "student-mock-2",
            StudentName = "Oliver Smith",
            Title = "Difference between mitosis and meiosis in biology?",
            Content = "Can someone summarize the core differences between Mitosis and Meiosis in terms of the final chromosome count and the types of cells produced? I have a quiz on Friday and the textbook diagrams are incredibly dense.",
            Subject = "Biology",
            Likes = 5,
            CreatedAt = DateTime.UtcNow.AddDays(-2).ToString("o"),
            Replies = new List<Reply> {
                new Reply {
                    Id = "r-2",
                    AuthorName = "Maya Lin",
                    AuthorRole = "tutor",
                    Content = "I got you, Oliver! Think of it this way: Mitosis = \"My-Toes\" (somatic/body cells, like toes!). It produces 2 identical daughter cells, both diploid (same chromosome count, 46 in humans). Meiosis = \"Me-O-My, make a baby\" (germ/sex cells, sperm & egg!). It involves two rounds of division, resulting in 4 genetically distinct haploid cells (half chromosome count, 23 in humans). Hope this helps you ace the quiz!",
                    CreatedAt = DateTime.UtcNow.AddHours(-40).ToString("o")
                }
            }
        }
    };

    private static void SeedData(NpgsqlConnection conn)
    {
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT COUNT(*) FROM tutors";
            var count = Convert.ToInt32(cmd.ExecuteScalar());
            if (count == 0)
            {
                foreach (var t in InitialTutors)
                {
                    using var ins = conn.CreateCommand();
                    ins.CommandText = "INSERT INTO tutors (id, name, avatar, bio, subjects, rating, reviewsCount, ratePerHour, availability, createdAt) VALUES (@id, @name, @avatar, @bio, @subjects::jsonb, @rating, @reviewsCount, @ratePerHour, @availability::jsonb, @createdAt)";
                    ins.Parameters.AddWithValue("id", t.Id);
                    ins.Parameters.AddWithValue("name", t.Name);
                    ins.Parameters.AddWithValue("avatar", t.Avatar);
                    ins.Parameters.AddWithValue("bio", t.Bio);
                    ins.Parameters.AddWithValue("subjects", JsonSerializer.Serialize(t.Subjects));
                    ins.Parameters.AddWithValue("rating", t.Rating);
                    ins.Parameters.AddWithValue("reviewsCount", t.ReviewsCount);
                    ins.Parameters.AddWithValue("ratePerHour", t.RatePerHour);
                    ins.Parameters.AddWithValue("availability", JsonSerializer.Serialize(t.Availability));
                    ins.Parameters.AddWithValue("createdAt", DateTime.UtcNow.ToString("o"));
                    ins.ExecuteNonQuery();
                }
            }
        }

        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT COUNT(*) FROM questions";
            var count = Convert.ToInt32(cmd.ExecuteScalar());
            if (count == 0)
            {
                foreach (var q in InitialQuestions)
                {
                    using var ins = conn.CreateCommand();
                    ins.CommandText = "INSERT INTO questions (id, studentId, studentName, title, content, subject, likes, replies, createdAt) VALUES (@id, @studentId, @studentName, @title, @content, @subject, @likes, @replies::jsonb, @createdAt)";
                    ins.Parameters.AddWithValue("id", q.Id);
                    ins.Parameters.AddWithValue("studentId", q.StudentId);
                    ins.Parameters.AddWithValue("studentName", q.StudentName);
                    ins.Parameters.AddWithValue("title", q.Title);
                    ins.Parameters.AddWithValue("content", q.Content);
                    ins.Parameters.AddWithValue("subject", q.Subject);
                    ins.Parameters.AddWithValue("likes", q.Likes);
                    ins.Parameters.AddWithValue("replies", JsonSerializer.Serialize(q.Replies));
                    ins.Parameters.AddWithValue("createdAt", q.CreatedAt);
                    ins.ExecuteNonQuery();
                }
            }
        }

        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT COUNT(*) FROM notifications";
            var count = Convert.ToInt32(cmd.ExecuteScalar());
            if (count == 0)
            {
                using var ins = conn.CreateCommand();
                ins.CommandText = "INSERT INTO notifications (id, userId, title, message, type, read, createdAt) VALUES (@id, @userId, @title, @message, @type, @read, @createdAt)";
                ins.Parameters.AddWithValue("id", "notif-welcome");
                ins.Parameters.AddWithValue("userId", "any");
                ins.Parameters.AddWithValue("title", "Welcome to The Learning Collective! 🌟");
                ins.Parameters.AddWithValue("message", "Explore our tutor profiles, book a personalized session, or post a doubt on the Question Board! We are here to learn, grow, and succeed together.");
                ins.Parameters.AddWithValue("type", "system");
                ins.Parameters.AddWithValue("read", false);
                ins.Parameters.AddWithValue("createdAt", DateTime.UtcNow.ToString("o"));
                ins.ExecuteNonQuery();
            }
        }
    }

    private static void InitializeJsonDb()
    {
        if (!File.Exists(FallbackDbPath))
        {
            var defaultDb = new JsonDbData
            {
                Tutors = InitialTutors,
                Questions = InitialQuestions,
                Notifications = new List<Notification>
                {
                    new Notification
                    {
                        Id = "notif-welcome",
                        UserId = "any",
                        Title = "Welcome to The Learning Collective! 🌟",
                        Message = "Explore our tutor profiles, book a personalized session, or post a doubt on the Question Board! We are here to learn, grow, and succeed together.",
                        Type = "system",
                        Read = false,
                        CreatedAt = DateTime.UtcNow.ToString("o")
                    }
                }
            };
            WriteJsonDb(defaultDb);
        }
    }

    private static string MakeId(string prefix)
    {
        return $"{prefix}-{Guid.NewGuid().ToString("N").Substring(0, 9)}";
    }

    // --- JSON DATABASE HELPERS ---

    public class JsonDbData
    {
        public List<User> Users { get; set; } = new();
        public List<Tutor> Tutors { get; set; } = new();
        public List<Session> Sessions { get; set; } = new();
        public List<Question> Questions { get; set; } = new();
        public List<Notification> Notifications { get; set; } = new();
    }

    private static JsonDbData ReadJsonDb()
    {
        try
        {
            if (!File.Exists(FallbackDbPath)) return new JsonDbData();
            var json = File.ReadAllText(FallbackDbPath);
            return JsonSerializer.Deserialize<JsonDbData>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new JsonDbData();
        }
        catch
        {
            return new JsonDbData();
        }
    }

    private static void WriteJsonDb(JsonDbData data)
    {
        try
        {
            var json = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(FallbackDbPath, json);
        }
        catch { }
    }

    // --- DB METHODS ---

    public static User SignUpUser(string email, string fullName, string role)
    {
        var id = MakeId("usr");
        var user = new User
        {
            Id = id,
            Email = email,
            FullName = fullName,
            Role = role,
            CreatedAt = DateTime.UtcNow.ToString("o")
        };

        if (_usePostgres && !string.IsNullOrEmpty(_connectionString))
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "INSERT INTO users (id, email, fullName, role, createdAt) VALUES (@id, @email, @fullName, @role, @createdAt) ON CONFLICT (email) DO UPDATE SET fullName = EXCLUDED.fullName RETURNING id, email, fullName, role, avatarUrl, createdAt";
            cmd.Parameters.AddWithValue("id", user.Id);
            cmd.Parameters.AddWithValue("email", user.Email);
            cmd.Parameters.AddWithValue("fullName", user.FullName);
            cmd.Parameters.AddWithValue("role", user.Role);
            cmd.Parameters.AddWithValue("createdAt", user.CreatedAt);
            using var r = cmd.ExecuteReader();
            if (r.Read())
            {
                return new User
                {
                    Id = r.GetString(0),
                    Email = r.GetString(1),
                    FullName = r.GetString(2),
                    Role = r.GetString(3),
                    AvatarUrl = r.IsDBNull(4) ? null : r.GetString(4),
                    CreatedAt = r.GetString(5)
                };
            }
        }
        else
        {
            var db = ReadJsonDb();
            var existing = db.Users.Find(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
            if (existing != null)
            {
                existing.FullName = fullName;
                WriteJsonDb(db);
                return existing;
            }
            db.Users.Add(user);
            WriteJsonDb(db);
        }
        return user;
    }

    public static User? SignInUser(string email)
    {
        if (_usePostgres && !string.IsNullOrEmpty(_connectionString))
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT id, email, fullName, role, avatarUrl, createdAt FROM users WHERE email = @email";
            cmd.Parameters.AddWithValue("email", email);
            using var r = cmd.ExecuteReader();
            if (r.Read())
            {
                return new User
                {
                    Id = r.GetString(0),
                    Email = r.GetString(1),
                    FullName = r.GetString(2),
                    Role = r.GetString(3),
                    AvatarUrl = r.IsDBNull(4) ? null : r.GetString(4),
                    CreatedAt = r.GetString(5)
                };
            }
            return null;
        }
        else
        {
            var db = ReadJsonDb();
            return db.Users.Find(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
        }
    }

    public static User? UpdateProfile(string id, Dictionary<string, string> updates)
    {
        if (_usePostgres && !string.IsNullOrEmpty(_connectionString))
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            using var cmd = conn.CreateCommand();
            
            var setClauses = new List<string>();
            if (updates.ContainsKey("fullName")) setClauses.Add("fullName = @fullName");
            if (updates.ContainsKey("avatarUrl")) setClauses.Add("avatarUrl = @avatarUrl");

            if (setClauses.Count == 0) return SignInUser(id);

            cmd.CommandText = $"UPDATE users SET {string.Join(", ", setClauses)} WHERE id = @id RETURNING id, email, fullName, role, avatarUrl, createdAt";
            cmd.Parameters.AddWithValue("id", id);
            if (updates.ContainsKey("fullName")) cmd.Parameters.AddWithValue("fullName", updates["fullName"]);
            if (updates.ContainsKey("avatarUrl")) cmd.Parameters.AddWithValue("avatarUrl", updates["avatarUrl"]);

            using var r = cmd.ExecuteReader();
            if (r.Read())
            {
                return new User
                {
                    Id = r.GetString(0),
                    Email = r.GetString(1),
                    FullName = r.GetString(2),
                    Role = r.GetString(3),
                    AvatarUrl = r.IsDBNull(4) ? null : r.GetString(4),
                    CreatedAt = r.GetString(5)
                };
            }
            return null;
        }
        else
        {
            var db = ReadJsonDb();
            var user = db.Users.Find(u => u.Id == id);
            if (user == null) return null;

            if (updates.TryGetValue("fullName", out var fn)) user.FullName = fn;
            if (updates.TryGetValue("avatarUrl", out var av)) user.AvatarUrl = av;

            WriteJsonDb(db);
            return user;
        }
    }

    public static List<Tutor> GetTutors()
    {
        if (_usePostgres && !string.IsNullOrEmpty(_connectionString))
        {
            var list = new List<Tutor>();
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT id, name, avatar, bio, subjects, rating, reviewsCount, ratePerHour, availability FROM tutors ORDER BY name ASC";
            using var r = cmd.ExecuteReader();
            while (r.Read())
            {
                list.Add(new Tutor
                {
                    Id = r.GetString(0),
                    Name = r.GetString(1),
                    Avatar = r.IsDBNull(2) ? "" : r.GetString(2),
                    Bio = r.IsDBNull(3) ? "" : r.GetString(3),
                    Subjects = JsonSerializer.Deserialize<string[]>(r.GetString(4)) ?? Array.Empty<string>(),
                    Rating = Convert.ToDouble(r.GetDecimal(5)),
                    ReviewsCount = r.GetInt32(6),
                    RatePerHour = r.GetInt32(7),
                    Availability = JsonSerializer.Deserialize<Dictionary<string, string[]>>(r.GetString(8)) ?? new()
                });
            }
            return list;
        }
        else
        {
            var db = ReadJsonDb();
            return db.Tutors;
        }
    }

    public static List<Session> GetSessions(string userId)
    {
        if (_usePostgres && !string.IsNullOrEmpty(_connectionString))
        {
            var list = new List<Session>();
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT id, studentId, studentName, tutorId, tutorName, tutorAvatar, subject, date, timeSlot, status, paymentStatus, amount, ratingGiven, createdAt FROM sessions WHERE studentId = @userId OR tutorId = @userId ORDER BY createdAt DESC";
            cmd.Parameters.AddWithValue("userId", userId);
            using var r = cmd.ExecuteReader();
            while (r.Read())
            {
                list.Add(new Session
                {
                    Id = r.GetString(0),
                    StudentId = r.GetString(1),
                    StudentName = r.GetString(2),
                    TutorId = r.GetString(3),
                    TutorName = r.GetString(4),
                    TutorAvatar = r.IsDBNull(5) ? null : r.GetString(5),
                    Subject = r.GetString(6),
                    Date = r.GetString(7),
                    TimeSlot = r.GetString(8),
                    Status = r.GetString(9),
                    PaymentStatus = r.GetString(10),
                    Amount = Convert.ToDouble(r.GetDecimal(11)),
                    RatingGiven = r.IsDBNull(12) ? null : r.GetInt32(12),
                    CreatedAt = r.GetString(13)
                });
            }
            return list;
        }
        else
        {
            var db = ReadJsonDb();
            return db.Sessions.FindAll(s => s.StudentId == userId || s.TutorId == userId);
        }
    }

    public static Session BookSession(Session session)
    {
        session.Id = MakeId("sess");
        session.Status = "pending";
        session.PaymentStatus = "unpaid";
        session.CreatedAt = DateTime.UtcNow.ToString("o");

        if (_usePostgres && !string.IsNullOrEmpty(_connectionString))
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO sessions (id, studentId, studentName, tutorId, tutorName, tutorAvatar, subject, date, timeSlot, status, paymentStatus, amount, ratingGiven, createdAt)
                VALUES (@id, @studentId, @studentName, @tutorId, @tutorName, @tutorAvatar, @subject, @date, @timeSlot, @status, @paymentStatus, @amount, @ratingGiven, @createdAt)";
            cmd.Parameters.AddWithValue("id", session.Id);
            cmd.Parameters.AddWithValue("studentId", session.StudentId);
            cmd.Parameters.AddWithValue("studentName", session.StudentName);
            cmd.Parameters.AddWithValue("tutorId", session.TutorId);
            cmd.Parameters.AddWithValue("tutorName", session.TutorName);
            cmd.Parameters.AddWithValue("tutorAvatar", session.TutorAvatar ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("subject", session.Subject);
            cmd.Parameters.AddWithValue("date", session.Date);
            cmd.Parameters.AddWithValue("timeSlot", session.TimeSlot);
            cmd.Parameters.AddWithValue("status", session.Status);
            cmd.Parameters.AddWithValue("paymentStatus", session.PaymentStatus);
            cmd.Parameters.AddWithValue("amount", (decimal)session.Amount);
            cmd.Parameters.AddWithValue("ratingGiven", session.RatingGiven ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("createdAt", session.CreatedAt);
            cmd.ExecuteNonQuery();

            // Book notification for tutor
            AddNotification(session.TutorId, "New Lesson Request! 📅", $"Student {session.StudentName} has requested a lesson on {session.Subject} at {session.Date} {session.TimeSlot}.", "booking");
        }
        else
        {
            var db = ReadJsonDb();
            db.Sessions.Add(session);
            db.Notifications.Add(new Notification
            {
                Id = MakeId("notif"),
                UserId = session.TutorId,
                Title = "New Lesson Request! 📅",
                Message = $"Student {session.StudentName} has requested a lesson on {session.Subject} at {session.Date} {session.TimeSlot}.",
                Type = "booking",
                Read = false,
                CreatedAt = DateTime.UtcNow.ToString("o")
            });
            WriteJsonDb(db);
        }
        return session;
    }

    public static Session? PaySession(string sessionId)
    {
        if (_usePostgres && !string.IsNullOrEmpty(_connectionString))
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "UPDATE sessions SET paymentStatus = 'paid' WHERE id = @id RETURNING id, studentId, studentName, tutorId, tutorName, tutorAvatar, subject, date, timeSlot, status, paymentStatus, amount, ratingGiven, createdAt";
            cmd.Parameters.AddWithValue("id", sessionId);
            using var r = cmd.ExecuteReader();
            if (r.Read())
            {
                var s = new Session
                {
                    Id = r.GetString(0),
                    StudentId = r.GetString(1),
                    StudentName = r.GetString(2),
                    TutorId = r.GetString(3),
                    TutorName = r.GetString(4),
                    TutorAvatar = r.IsDBNull(5) ? null : r.GetString(5),
                    Subject = r.GetString(6),
                    Date = r.GetString(7),
                    TimeSlot = r.GetString(8),
                    Status = r.GetString(9),
                    PaymentStatus = r.GetString(10),
                    Amount = Convert.ToDouble(r.GetDecimal(11)),
                    RatingGiven = r.IsDBNull(12) ? null : r.GetInt32(12),
                    CreatedAt = r.GetString(13)
                };
                r.Close();
                AddNotification(s.StudentId, "Payment Successful! 💳", $"Your payment of ${s.Amount:F2} for the lesson with {s.TutorName} was processed successfully. Thank you!", "payment");
                return s;
            }
            return null;
        }
        else
        {
            var db = ReadJsonDb();
            var s = db.Sessions.Find(x => x.Id == sessionId);
            if (s == null) return null;

            s.PaymentStatus = "paid";
            db.Notifications.Add(new Notification
            {
                Id = MakeId("notif"),
                UserId = s.StudentId,
                Title = "Payment Successful! 💳",
                Message = $"Your payment of ${s.Amount:F2} for the lesson with {s.TutorName} was processed successfully. Thank you!",
                Type = "payment",
                Read = false,
                CreatedAt = DateTime.UtcNow.ToString("o")
            });

            WriteJsonDb(db);
            return s;
        }
    }

    public static Session? CompleteSession(string sessionId)
    {
        if (_usePostgres && !string.IsNullOrEmpty(_connectionString))
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "UPDATE sessions SET status = 'completed' WHERE id = @id RETURNING id, studentId, studentName, tutorId, tutorName, tutorAvatar, subject, date, timeSlot, status, paymentStatus, amount, ratingGiven, createdAt";
            cmd.Parameters.AddWithValue("id", sessionId);
            using var r = cmd.ExecuteReader();
            if (r.Read())
            {
                var s = new Session
                {
                    Id = r.GetString(0),
                    StudentId = r.GetString(1),
                    StudentName = r.GetString(2),
                    TutorId = r.GetString(3),
                    TutorName = r.GetString(4),
                    TutorAvatar = r.IsDBNull(5) ? null : r.GetString(5),
                    Subject = r.GetString(6),
                    Date = r.GetString(7),
                    TimeSlot = r.GetString(8),
                    Status = r.GetString(9),
                    PaymentStatus = r.GetString(10),
                    Amount = Convert.ToDouble(r.GetDecimal(11)),
                    RatingGiven = r.IsDBNull(12) ? null : r.GetInt32(12),
                    CreatedAt = r.GetString(13)
                };
                r.Close();
                AddNotification(s.StudentId, "Lesson Completed! 🎓", $"How was your lesson on {s.Subject} with {s.TutorName}? Share feedback by rating your session!", "system");
                return s;
            }
            return null;
        }
        else
        {
            var db = ReadJsonDb();
            var s = db.Sessions.Find(x => x.Id == sessionId);
            if (s == null) return null;

            s.Status = "completed";
            db.Notifications.Add(new Notification
            {
                Id = MakeId("notif"),
                UserId = s.StudentId,
                Title = "Lesson Completed! 🎓",
                Message = $"How was your lesson on {s.Subject} with {s.TutorName}? Share feedback by rating your session!",
                Type = "system",
                Read = false,
                CreatedAt = DateTime.UtcNow.ToString("o")
            });

            WriteJsonDb(db);
            return s;
        }
    }

    public static Session? RateSession(string sessionId, int ratingGiven)
    {
        if (_usePostgres && !string.IsNullOrEmpty(_connectionString))
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "UPDATE sessions SET ratingGiven = @ratingGiven WHERE id = @id RETURNING id, studentId, studentName, tutorId, tutorName, tutorAvatar, subject, date, timeSlot, status, paymentStatus, amount, ratingGiven, createdAt";
            cmd.Parameters.AddWithValue("id", sessionId);
            cmd.Parameters.AddWithValue("ratingGiven", ratingGiven);
            using var r = cmd.ExecuteReader();
            if (r.Read())
            {
                var s = new Session
                {
                    Id = r.GetString(0),
                    StudentId = r.GetString(1),
                    StudentName = r.GetString(2),
                    TutorId = r.GetString(3),
                    TutorName = r.GetString(4),
                    TutorAvatar = r.IsDBNull(5) ? null : r.GetString(5),
                    Subject = r.GetString(6),
                    Date = r.GetString(7),
                    TimeSlot = r.GetString(8),
                    Status = r.GetString(9),
                    PaymentStatus = r.GetString(10),
                    Amount = Convert.ToDouble(r.GetDecimal(11)),
                    RatingGiven = r.IsDBNull(12) ? null : r.GetInt32(12),
                    CreatedAt = r.GetString(13)
                };
                r.Close();
                
                // Dynamically update tutor metrics in DB
                using var metricCmd = conn.CreateCommand();
                metricCmd.CommandText = "UPDATE tutors SET rating = (rating * reviewsCount + @ratingGiven) / (reviewsCount + 1), reviewsCount = reviewsCount + 1 WHERE id = @tutorId";
                metricCmd.Parameters.AddWithValue("ratingGiven", (decimal)ratingGiven);
                metricCmd.Parameters.AddWithValue("tutorId", s.TutorId);
                metricCmd.ExecuteNonQuery();

                return s;
            }
            return null;
        }
        else
        {
            var db = ReadJsonDb();
            var s = db.Sessions.Find(x => x.Id == sessionId);
            if (s == null) return null;

            s.RatingGiven = ratingGiven;
            
            var t = db.Tutors.Find(x => x.Id == s.TutorId);
            if (t != null)
            {
                t.Rating = Math.Round((t.Rating * t.ReviewsCount + ratingGiven) / (t.ReviewsCount + 1), 1);
                t.ReviewsCount += 1;
            }

            WriteJsonDb(db);
            return s;
        }
    }

    public static List<Question> GetQuestions()
    {
        if (_usePostgres && !string.IsNullOrEmpty(_connectionString))
        {
            var list = new List<Question>();
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT id, studentId, studentName, title, content, subject, likes, replies, createdAt FROM questions ORDER BY createdAt DESC";
            using var r = cmd.ExecuteReader();
            while (r.Read())
            {
                list.Add(new Question
                {
                    Id = r.GetString(0),
                    StudentId = r.GetString(1),
                    StudentName = r.GetString(2),
                    Title = r.GetString(3),
                    Content = r.GetString(4),
                    Subject = r.GetString(5),
                    Likes = r.GetInt32(6),
                    Replies = JsonSerializer.Deserialize<List<Reply>>(r.GetString(7)) ?? new(),
                    CreatedAt = r.GetString(8)
                });
            }
            return list;
        }
        else
        {
            var db = ReadJsonDb();
            db.Questions.Sort((a, b) => string.Compare(b.CreatedAt, a.CreatedAt, StringComparison.Ordinal));
            return db.Questions;
        }
    }

    public static Question AddQuestion(string studentId, string studentName, string title, string content, string subject)
    {
        var q = new Question
        {
            Id = MakeId("q"),
            StudentId = studentId,
            StudentName = studentName,
            Title = title,
            Content = content,
            Subject = subject,
            Likes = 0,
            Replies = new List<Reply>(),
            CreatedAt = DateTime.UtcNow.ToString("o")
        };

        if (_usePostgres && !string.IsNullOrEmpty(_connectionString))
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "INSERT INTO questions (id, studentId, studentName, title, content, subject, likes, replies, createdAt) VALUES (@id, @studentId, @studentName, @title, @content, @subject, @likes, @replies::jsonb, @createdAt)";
            cmd.Parameters.AddWithValue("id", q.Id);
            cmd.Parameters.AddWithValue("studentId", q.StudentId);
            cmd.Parameters.AddWithValue("studentName", q.StudentName);
            cmd.Parameters.AddWithValue("title", q.Title);
            cmd.Parameters.AddWithValue("content", q.Content);
            cmd.Parameters.AddWithValue("subject", q.Subject);
            cmd.Parameters.AddWithValue("likes", q.Likes);
            cmd.Parameters.AddWithValue("replies", JsonSerializer.Serialize(q.Replies));
            cmd.Parameters.AddWithValue("createdAt", q.CreatedAt);
            cmd.ExecuteNonQuery();

            // Notify everyone
            AddNotification("any", "New doubt posted! 💡", $"Student {studentName} has asked a question on {subject}: '{title}'", "question");
        }
        else
        {
            var db = ReadJsonDb();
            db.Questions.Add(q);
            db.Notifications.Add(new Notification
            {
                Id = MakeId("notif"),
                UserId = "any",
                Title = "New doubt posted! 💡",
                Message = $"Student {studentName} has asked a question on {subject}: '{title}'",
                Type = "question",
                Read = false,
                CreatedAt = DateTime.UtcNow.ToString("o")
            });
            WriteJsonDb(db);
        }
        return q;
    }

    public static Reply? AddReply(string questionId, string authorName, string authorRole, string content)
    {
        var reply = new Reply
        {
            Id = MakeId("rep"),
            AuthorName = authorName,
            AuthorRole = authorRole,
            Content = content,
            CreatedAt = DateTime.UtcNow.ToString("o")
        };

        if (_usePostgres && !string.IsNullOrEmpty(_connectionString))
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT replies, studentId, title FROM questions WHERE id = @id";
            cmd.Parameters.AddWithValue("id", questionId);
            string repliesJson = "[]";
            string studentId = "";
            string title = "";
            using (var r = cmd.ExecuteReader())
            {
                if (r.Read())
                {
                    repliesJson = r.GetString(0);
                    studentId = r.GetString(1);
                    title = r.GetString(2);
                }
                else
                {
                    return null;
                }
            }

            var list = JsonSerializer.Deserialize<List<Reply>>(repliesJson) ?? new List<Reply>();
            list.Add(reply);

            using var updateCmd = conn.CreateCommand();
            updateCmd.CommandText = "UPDATE questions SET replies = @replies::jsonb WHERE id = @id";
            updateCmd.Parameters.AddWithValue("id", questionId);
            updateCmd.Parameters.AddWithValue("replies", JsonSerializer.Serialize(list));
            updateCmd.ExecuteNonQuery();

            // Notify student of a new reply
            AddNotification(studentId, "New Reply on your Question! 💬", $"{authorName} ({authorRole}) replied to your doubt '{title}'", "question");
        }
        else
        {
            var db = ReadJsonDb();
            var q = db.Questions.Find(x => x.Id == questionId);
            if (q == null) return null;

            q.Replies.Add(reply);
            db.Notifications.Add(new Notification
            {
                Id = MakeId("notif"),
                UserId = q.StudentId,
                Title = "New Reply on your Question! 💬",
                Message = $"{authorName} ({authorRole}) replied to your doubt '{q.Title}'",
                Type = "question",
                Read = false,
                CreatedAt = DateTime.UtcNow.ToString("o")
            });

            WriteJsonDb(db);
        }
        return reply;
    }

    public static int LikeQuestion(string questionId)
    {
        if (_usePostgres && !string.IsNullOrEmpty(_connectionString))
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "UPDATE questions SET likes = likes + 1 WHERE id = @id RETURNING likes";
            cmd.Parameters.AddWithValue("id", questionId);
            var result = cmd.ExecuteScalar();
            return result != null ? Convert.ToInt32(result) : -1;
        }
        else
        {
            var db = ReadJsonDb();
            var q = db.Questions.Find(x => x.Id == questionId);
            if (q == null) return -1;

            q.Likes += 1;
            WriteJsonDb(db);
            return q.Likes;
        }
    }

    public static List<Notification> GetNotifications(string userId)
    {
        if (_usePostgres && !string.IsNullOrEmpty(_connectionString))
        {
            var list = new List<Notification>();
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT id, userId, title, message, type, read, createdAt FROM notifications WHERE userId = @userId OR userId = 'any' ORDER BY createdAt DESC";
            cmd.Parameters.AddWithValue("userId", userId);
            using var r = cmd.ExecuteReader();
            while (r.Read())
            {
                list.Add(new Notification
                {
                    Id = r.GetString(0),
                    UserId = r.GetString(1),
                    Title = r.GetString(2),
                    Message = r.GetString(3),
                    Type = r.GetString(4),
                    Read = r.GetBoolean(5),
                    CreatedAt = r.GetString(6)
                });
            }
            return list;
        }
        else
        {
            var db = ReadJsonDb();
            var list = db.Notifications.FindAll(n => n.UserId == userId || n.UserId == "any");
            list.Sort((a, b) => string.Compare(b.CreatedAt, a.CreatedAt, StringComparison.Ordinal));
            return list;
        }
    }

    public static void MarkNotificationsRead(string? userId, string? notificationId)
    {
        if (_usePostgres && !string.IsNullOrEmpty(_connectionString))
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            using var cmd = conn.CreateCommand();
            if (!string.IsNullOrEmpty(notificationId))
            {
                cmd.CommandText = "UPDATE notifications SET read = true WHERE id = @id";
                cmd.Parameters.AddWithValue("id", notificationId);
            }
            else
            {
                cmd.CommandText = "UPDATE notifications SET read = true WHERE userId = @userId OR userId = 'any'";
                cmd.Parameters.AddWithValue("userId", userId ?? "");
            }
            cmd.ExecuteNonQuery();
        }
        else
        {
            var db = ReadJsonDb();
            if (!string.IsNullOrEmpty(notificationId))
            {
                var n = db.Notifications.Find(x => x.Id == notificationId);
                if (n != null) n.Read = true;
            }
            else if (!string.IsNullOrEmpty(userId))
            {
                foreach (var n in db.Notifications)
                {
                    if (n.UserId == userId || n.UserId == "any") n.Read = true;
                }
            }
            WriteJsonDb(db);
        }
    }

    public static Notification AddNotification(string userId, string title, string message, string type)
    {
        var n = new Notification
        {
            Id = MakeId("notif"),
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            Read = false,
            CreatedAt = DateTime.UtcNow.ToString("o")
        };

        if (_usePostgres && !string.IsNullOrEmpty(_connectionString))
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "INSERT INTO notifications (id, userId, title, message, type, read, createdAt) VALUES (@id, @userId, @title, @message, @type, @read, @createdAt)";
            cmd.Parameters.AddWithValue("id", n.Id);
            cmd.Parameters.AddWithValue("userId", n.UserId);
            cmd.Parameters.AddWithValue("title", n.Title);
            cmd.Parameters.AddWithValue("message", n.Message);
            cmd.Parameters.AddWithValue("type", n.Type);
            cmd.Parameters.AddWithValue("read", n.Read);
            cmd.Parameters.AddWithValue("createdAt", n.CreatedAt);
            cmd.ExecuteNonQuery();
        }
        else
        {
            var db = ReadJsonDb();
            db.Notifications.Add(n);
            WriteJsonDb(db);
        }
        return n;
    }

    // --- AUTOMATION SIMULATOR REPLY ---
    public static void SimulateTutorReply(string questionId, string subject)
    {
        var tutors = GetTutors();
        var potentialTutors = tutors.FindAll(t => Array.Exists(t.Subjects, s => s.Equals(subject, StringComparison.OrdinalIgnoreCase)));
        var tutor = potentialTutors.Count > 0 ? potentialTutors[0] : tutors[0];

        var responsesBySubject = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
        {
            { "Algebra", new[] {
                "Hey! This is a great Algebra question. To solve this, you first want to isolate the variable. Try grouping all terms containing x on the left-hand side, and all constants on the right. Let me know if that works out!",
                "Double-check your negative signs here! It is super common to miss distributing a negative sign inside parentheses, e.g., -2(x - 3) becomes -2x + 6."
            }},
            { "Calculus", new[] {
                "That is a classic integration question. When you see functions nested inside trigonometric or power functions, u-substitution is your best friend. Look for 'du' floating around in your differential!",
                "Remember, when using the Quotient Rule, the mnemonic 'low d-high minus high d-low over square of what's below' works wonders! Try setting it up step-by-step."
            }},
            { "Chemistry", new[] {
                "Be sure to balance your chemical equation before doing any stoichiometry calculations! Remember, the number of atoms of each element must remain conserved from reactants to products.",
                "For pH calculations, keep in mind that pH = -log[H+]. If you have pOH, you can easily find pH by subtracting pOH from 14. Excellent question!"
            }},
            { "Physics", new[] {
                "Remember that force is a vector! When you draw your Free Body Diagram, always resolve forces into horizontal and vertical components. This will make applying Newton's 2nd Law much easier.",
                "Since there are no external forces like friction acting on the system, mechanical energy is conserved! Try equating the potential energy at the top to the kinetic energy at the bottom: mgh = 0.5 * m * v^2."
            }}
        };

        var responses = responsesBySubject.TryGetValue(subject, out var list) ? list : new[] {
            "Thanks for posting your doubt! That is an interesting problem. Let's start by breaking down the question into knowns and unknowns. What have you tried so far? Let's solve it together!",
            "An excellent conceptual question. In our sessions, we often draw diagrams to visualize this. Try sketching a simple diagram representing the problem statement and see if a relationship emerges."
        };

        var content = responses[new Random().Next(responses.Length)];
        AddReply(questionId, tutor.Name, "tutor", content);
    }
}
