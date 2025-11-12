using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiEcoBin.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarCondominioIdEmUsuarios2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "USU_CONId",
                table: "USUarios",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_USUarios_USU_CONId",
                table: "USUarios",
                column: "USU_CONId");

            migrationBuilder.AddForeignKey(
                name: "FK_USUarios_CONdominios_USU_CONId",
                table: "USUarios",
                column: "USU_CONId",
                principalTable: "CONdominios",
                principalColumn: "ID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_USUarios_CONdominios_USU_CONId",
                table: "USUarios");

            migrationBuilder.DropIndex(
                name: "IX_USUarios_USU_CONId",
                table: "USUarios");

            migrationBuilder.DropColumn(
                name: "USU_CONId",
                table: "USUarios");
        }
    }
}
