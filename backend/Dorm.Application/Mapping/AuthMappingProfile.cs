using AutoMapper;
using Dorm.Application.DTOs.Auth;
using Dorm.Domain.Entities;

namespace Dorm.Application.Mapping;

public sealed class AuthMappingProfile : Profile
{
    public AuthMappingProfile()
    {
        CreateMap<User, UserDto>();
    }
}
