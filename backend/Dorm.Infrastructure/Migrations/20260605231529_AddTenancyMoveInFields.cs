using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dorm.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTenancyMoveInFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "MovedInAt",
                table: "Tenancies",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PlannedMoveInDate",
                table: "Tenancies",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MovedInAt",
                table: "Tenancies");

            migrationBuilder.DropColumn(
                name: "PlannedMoveInDate",
                table: "Tenancies");
        }
    }
}
