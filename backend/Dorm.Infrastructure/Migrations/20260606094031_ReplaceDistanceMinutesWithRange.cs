using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dorm.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceDistanceMinutesWithRange : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DistanceMinutes",
                table: "Apartments");

            migrationBuilder.AddColumn<string>(
                name: "DistanceRange",
                table: "Apartments",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DistanceRange",
                table: "Apartments");

            migrationBuilder.AddColumn<int>(
                name: "DistanceMinutes",
                table: "Apartments",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
