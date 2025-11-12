using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiEcoBin.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarTabelaDeNotificacoes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TOKenLogin");

            migrationBuilder.CreateTable(
                name: "EXPoTokens",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EXP_USUId = table.Column<int>(type: "int", nullable: false),
                    EXPToken = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    EXPDispositivo = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    EXPPlataforma = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    EXPDataCriacao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EXPUltimaAtualizacao = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EXPAtivo = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EXPoTokens", x => x.ID);
                    table.ForeignKey(
                        name: "FK_EXPoTokens_USUarios_EXP_USUId",
                        column: x => x.EXP_USUId,
                        principalTable: "USUarios",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "NOTificacoes",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NOT_EXPId = table.Column<int>(type: "int", nullable: true),
                    NOT_USUId = table.Column<int>(type: "int", nullable: true),
                    NOTTitulo = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    NOTMensagem = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    NOTDados = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NOTDataEnvio = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NOTLida = table.Column<bool>(type: "bit", nullable: false),
                    NOTDataLeitura = table.Column<DateTime>(type: "datetime2", nullable: true),
                    NOTEnviada = table.Column<bool>(type: "bit", nullable: false),
                    NOTErro = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NOTificacoes", x => x.ID);
                    table.ForeignKey(
                        name: "FK_NOTificacoes_EXPoTokens_NOT_EXPId",
                        column: x => x.NOT_EXPId,
                        principalTable: "EXPoTokens",
                        principalColumn: "ID");
                    table.ForeignKey(
                        name: "FK_NOTificacoes_USUarios_NOT_USUId",
                        column: x => x.NOT_USUId,
                        principalTable: "USUarios",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateIndex(
                name: "IX_EXPoTokens_EXP_USUId",
                table: "EXPoTokens",
                column: "EXP_USUId");

            migrationBuilder.CreateIndex(
                name: "IX_NOTificacoes_NOT_EXPId",
                table: "NOTificacoes",
                column: "NOT_EXPId");

            migrationBuilder.CreateIndex(
                name: "IX_NOTificacoes_NOT_USUId",
                table: "NOTificacoes",
                column: "NOT_USUId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NOTificacoes");

            migrationBuilder.DropTable(
                name: "EXPoTokens");

            migrationBuilder.CreateTable(
                name: "TOKenLogin",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TOK_USUId = table.Column<int>(type: "int", nullable: false),
                    TOKAtivo = table.Column<bool>(type: "bit", nullable: false),
                    TOKDataCriacao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TOKDataExpiracao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TOKDispositivo = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    TOKIpAddress = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true),
                    TOKRevogado = table.Column<bool>(type: "bit", nullable: false),
                    TOKToken = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false)
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
    }
}
