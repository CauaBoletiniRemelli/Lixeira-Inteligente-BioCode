using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiEcoBin.Migrations
{
    /// <inheritdoc />
    public partial class CriandoBanco : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CONdominios",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CONNome = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CONEndereco = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    CONCriadoEm = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CONdominios", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "USUarios",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    USUNome = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    USUEmail = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    USUSenhaHash = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    USUTipo = table.Column<int>(type: "int", nullable: false),
                    USUCriadoEm = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_USUarios", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "SENsores",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SENDeviceId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    SENDeviceKey = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    SENStatus = table.Column<int>(type: "int", nullable: false),
                    SEN_CONId = table.Column<int>(type: "int", nullable: true),
                    SENUltimaConexao = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SENCriadoEm = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SENsores", x => x.ID);
                    table.ForeignKey(
                        name: "FK_SENsores_CONdominios_SEN_CONId",
                        column: x => x.SEN_CONId,
                        principalTable: "CONdominios",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateTable(
                name: "PROvisionamentos",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PRO_SENId = table.Column<int>(type: "int", nullable: false),
                    PROSsidCriptografado = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false),
                    PROSenhaWifiCriptografada = table.Column<string>(type: "nvarchar(1024)", maxLength: 1024, nullable: false),
                    PRONomeSensor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PRO_USUId = table.Column<int>(type: "int", nullable: false),
                    PROExpiracao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PROUsado = table.Column<bool>(type: "bit", nullable: false),
                    PROCriadoEm = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PROvisionamentos", x => x.ID);
                    table.ForeignKey(
                        name: "FK_PROvisionamentos_SENsores_PRO_SENId",
                        column: x => x.PRO_SENId,
                        principalTable: "SENsores",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PROvisionamentos_USUarios_PRO_USUId",
                        column: x => x.PRO_USUId,
                        principalTable: "USUarios",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TELemetrias",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TEL_SENId = table.Column<int>(type: "int", nullable: false),
                    TELMomento = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TELNivelOcupacao = table.Column<int>(type: "int", nullable: true),
                    TELBateria = table.Column<int>(type: "int", nullable: true),
                    TELTemperatura = table.Column<decimal>(type: "decimal(6,2)", nullable: true),
                    TELDadosBrutos = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TELemetrias", x => x.ID);
                    table.ForeignKey(
                        name: "FK_TELemetrias_SENsores_TEL_SENId",
                        column: x => x.TEL_SENId,
                        principalTable: "SENsores",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PROvisionamentos_PRO_SENId",
                table: "PROvisionamentos",
                column: "PRO_SENId");

            migrationBuilder.CreateIndex(
                name: "IX_PROvisionamentos_PRO_USUId",
                table: "PROvisionamentos",
                column: "PRO_USUId");

            migrationBuilder.CreateIndex(
                name: "IX_SENsores_SEN_CONId",
                table: "SENsores",
                column: "SEN_CONId");

            migrationBuilder.CreateIndex(
                name: "IX_TELemetrias_TEL_SENId",
                table: "TELemetrias",
                column: "TEL_SENId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PROvisionamentos");

            migrationBuilder.DropTable(
                name: "TELemetrias");

            migrationBuilder.DropTable(
                name: "USUarios");

            migrationBuilder.DropTable(
                name: "SENsores");

            migrationBuilder.DropTable(
                name: "CONdominios");
        }
    }
}
