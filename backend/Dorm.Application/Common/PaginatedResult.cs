namespace Dorm.Application.Common;

public sealed record PaginatedResult<T>(
    IReadOnlyList<T> Items,
    int Page,
    int PageSize,
    int Total,
    int TotalPages)
{
    public static PaginatedResult<T> Create(IReadOnlyList<T> items, int page, int pageSize, int total)
    {
        var totalPages = pageSize <= 0 ? 0 : (int)Math.Ceiling(total / (double)pageSize);
        return new PaginatedResult<T>(items, page, pageSize, total, totalPages);
    }
}
