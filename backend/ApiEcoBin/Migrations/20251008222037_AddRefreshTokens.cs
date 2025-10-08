using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiEcoBin.Migrations
{
    /// <inheritdoc />
    public partial class AddRefreshTokens : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "REFreshTokens",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    REF_USUId = table.Column<int>(type: "int", nullable: false),
                    REFToken = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    REFExpiracao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    REFCriadoEm = table.Column<DateTime>(type: "datetime2", nullable: false),
                    REFRevogado = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_REFreshTokens", x => x.ID);
                    table.ForeignKey(
                        name: "FK_REFreshTokens_USUarios_REF_USUId",
                        column: x => x.REF_USUId,
                        principalTable: "USUarios",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_REFreshTokens_REF_USUId",
                table: "REFreshTokens",
                column: "REF_USUId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "REFreshTokens");
        }
    }
}
