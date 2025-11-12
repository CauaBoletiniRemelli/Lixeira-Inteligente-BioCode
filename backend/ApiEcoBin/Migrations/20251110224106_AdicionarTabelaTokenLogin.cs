using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiEcoBin.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarTabelaTokenLogin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TOKenLogin",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TOK_USUId = table.Column<int>(type: "int", nullable: false),
                    TOKToken = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    TOKDispositivo = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    TOKIpAddress = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true),
                    TOKDataCriacao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TOKDataExpiracao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TOKAtivo = table.Column<bool>(type: "bit", nullable: false),
                    TOKRevogado = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TOKenLogin", x => x.ID);
                    table.ForeignKey(
                        name: "FK_TOKenLogin_USUarios_TOK_USUId",
                        column: x => x.TOK_USUId,
                        principalTable: "USUarios",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TOKenLogin_TOK_USUId",
                table: "TOKenLogin",
                column: "TOK_USUId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TOKenLogin");
        }
    }
}
