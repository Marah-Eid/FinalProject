using Dorm.Application.Services.Admin;
using Dorm.Application.Services.Apartments;
using Dorm.Application.Services.Applications;
using Dorm.Application.Services.Auth;
using Dorm.Application.Services.Compatibility;
using Dorm.Application.Services.Messages;
using Dorm.Application.Services.Notifications;
using Dorm.Application.Services.Payments;
using Dorm.Application.Services.Quiz;
using Dorm.Application.Services.Ratings;
using Dorm.Application.Services.Reports;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace Dorm.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddDormApplication(this IServiceCollection services)
    {
        var assembly = typeof(DependencyInjection).Assembly;

        // AutoMapper — scans for Profile subclasses.
        services.AddAutoMapper(cfg => cfg.AddMaps(assembly));

        // FluentValidation — registers all AbstractValidator<T> as IValidator<T>.
        services.AddValidatorsFromAssembly(assembly);

        // Application services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IQuizService, QuizService>();
        services.AddScoped<IApartmentService, ApartmentService>();
        services.AddSingleton<ICompatibilityService, CompatibilityService>();
        services.AddScoped<IApplicationService, ApplicationService>();
        services.AddScoped<IMessageService, MessageService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IPaymentsAppService, PaymentsAppService>();
        services.AddScoped<IRatingService, RatingService>();
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<IAdminService, AdminService>();

        return services;
    }
}
