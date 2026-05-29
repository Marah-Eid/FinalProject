using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dorm.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentRelatedEntityId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "RelatedEntityId",
                table: "Payments",
                type: "uniqueidentifier",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RelatedEntityId",
                table: "Payments");
        }
    }
}
