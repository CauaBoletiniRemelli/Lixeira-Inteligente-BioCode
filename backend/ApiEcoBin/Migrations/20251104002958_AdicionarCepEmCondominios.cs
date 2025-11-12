using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiEcoBin.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarCepEmCondominios : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CONCep",
                table: "CONdominios",
                type: "nvarchar(9)",
                maxLength: 9,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CONCep",
                table: "CONdominios");
        }
    }
}
