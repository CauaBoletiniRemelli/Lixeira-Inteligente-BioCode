using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiEcoBin.Migrations
{
    /// <inheritdoc />
    public partial class AddEnergiaSolarEOleo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "TELCarregando",
                table: "TELemetrias",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TELCorrentePainel",
                table: "TELemetrias",
                type: "decimal(8,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TELTensaoBateria",
                table: "TELemetrias",
                type: "decimal(5,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TELTensaoPainel",
                table: "TELemetrias",
                type: "decimal(5,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SENCapacidadeLitros",
                table: "SENsores",
                type: "decimal(8,2)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "OLEColetas",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OLE_CONId = table.Column<int>(type: "int", nullable: false),
                    OLE_SENId = table.Column<int>(type: "int", nullable: true),
                    OLE_USUId = table.Column<int>(type: "int", nullable: true),
                    OLELitros = table.Column<decimal>(type: "decimal(8,2)", nullable: false),
                    OLEDestino = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    OLEObservacao = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    OLEDataColeta = table.Column<DateTime>(type: "datetime2", nullable: false),
                    OLECriadoEm = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OLEColetas", x => x.ID);
                    table.ForeignKey(
                        name: "FK_OLEColetas_CONdominios_OLE_CONId",
                        column: x => x.OLE_CONId,
                        principalTable: "CONdominios",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OLEColetas_SENsores_OLE_SENId",
                        column: x => x.OLE_SENId,
                        principalTable: "SENsores",
                        principalColumn: "ID");
                    table.ForeignKey(
                        name: "FK_OLEColetas_USUarios_OLE_USUId",
                        column: x => x.OLE_USUId,
                        principalTable: "USUarios",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateIndex(
                name: "IX_OLEColetas_OLE_CONId",
                table: "OLEColetas",
                column: "OLE_CONId");

            migrationBuilder.CreateIndex(
                name: "IX_OLEColetas_OLE_SENId",
                table: "OLEColetas",
                column: "OLE_SENId");

            migrationBuilder.CreateIndex(
                name: "IX_OLEColetas_OLE_USUId",
                table: "OLEColetas",
                column: "OLE_USUId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OLEColetas");

            migrationBuilder.DropColumn(
                name: "TELCarregando",
                table: "TELemetrias");

            migrationBuilder.DropColumn(
                name: "TELCorrentePainel",
                table: "TELemetrias");

            migrationBuilder.DropColumn(
                name: "TELTensaoBateria",
                table: "TELemetrias");

            migrationBuilder.DropColumn(
                name: "TELTensaoPainel",
                table: "TELemetrias");

            migrationBuilder.DropColumn(
                name: "SENCapacidadeLitros",
                table: "SENsores");
        }
    }
}
