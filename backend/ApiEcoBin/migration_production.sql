IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251008004741_CriandoBanco'
)
BEGIN
    CREATE TABLE [CONdominios] (
        [ID] int NOT NULL IDENTITY,
        [CONNome] nvarchar(100) NOT NULL,
        [CONEndereco] nvarchar(255) NULL,
        [CONCriadoEm] datetime2 NULL,
        CONSTRAINT [PK_CONdominios] PRIMARY KEY ([ID])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251008004741_CriandoBanco'
)
BEGIN
    CREATE TABLE [USUarios] (
        [ID] int NOT NULL IDENTITY,
        [USUNome] nvarchar(100) NOT NULL,
        [USUEmail] nvarchar(100) NOT NULL,
        [USUSenhaHash] nvarchar(255) NOT NULL,
        [USUTipo] int NOT NULL,
        [USUCriadoEm] datetime2 NULL,
        CONSTRAINT [PK_USUarios] PRIMARY KEY ([ID])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251008004741_CriandoBanco'
)
BEGIN
    CREATE TABLE [SENsores] (
        [ID] int NOT NULL IDENTITY,
        [SENDeviceId] nvarchar(50) NOT NULL,
        [SENDeviceKey] nvarchar(255) NOT NULL,
        [SENStatus] int NOT NULL,
        [SEN_CONId] int NULL,
        [SENUltimaConexao] datetime2 NULL,
        [SENCriadoEm] datetime2 NULL,
        CONSTRAINT [PK_SENsores] PRIMARY KEY ([ID]),
        CONSTRAINT [FK_SENsores_CONdominios_SEN_CONId] FOREIGN KEY ([SEN_CONId]) REFERENCES [CONdominios] ([ID])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251008004741_CriandoBanco'
)
BEGIN
    CREATE TABLE [PROvisionamentos] (
        [ID] int NOT NULL IDENTITY,
        [PRO_SENId] int NOT NULL,
        [PROSsidCriptografado] nvarchar(512) NOT NULL,
        [PROSenhaWifiCriptografada] nvarchar(1024) NOT NULL,
        [PRONomeSensor] nvarchar(100) NULL,
        [PRO_USUId] int NOT NULL,
        [PROExpiracao] datetime2 NOT NULL,
        [PROUsado] bit NOT NULL,
        [PROCriadoEm] datetime2 NULL,
        CONSTRAINT [PK_PROvisionamentos] PRIMARY KEY ([ID]),
        CONSTRAINT [FK_PROvisionamentos_SENsores_PRO_SENId] FOREIGN KEY ([PRO_SENId]) REFERENCES [SENsores] ([ID]) ON DELETE CASCADE,
        CONSTRAINT [FK_PROvisionamentos_USUarios_PRO_USUId] FOREIGN KEY ([PRO_USUId]) REFERENCES [USUarios] ([ID]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251008004741_CriandoBanco'
)
BEGIN
    CREATE TABLE [TELemetrias] (
        [ID] int NOT NULL IDENTITY,
        [TEL_SENId] int NOT NULL,
        [TELMomento] datetime2 NULL,
        [TELNivelOcupacao] int NULL,
        [TELBateria] int NULL,
        [TELTemperatura] decimal(6,2) NULL,
        [TELDadosBrutos] nvarchar(max) NULL,
        CONSTRAINT [PK_TELemetrias] PRIMARY KEY ([ID]),
        CONSTRAINT [FK_TELemetrias_SENsores_TEL_SENId] FOREIGN KEY ([TEL_SENId]) REFERENCES [SENsores] ([ID]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251008004741_CriandoBanco'
)
BEGIN
    CREATE INDEX [IX_PROvisionamentos_PRO_SENId] ON [PROvisionamentos] ([PRO_SENId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251008004741_CriandoBanco'
)
BEGIN
    CREATE INDEX [IX_PROvisionamentos_PRO_USUId] ON [PROvisionamentos] ([PRO_USUId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251008004741_CriandoBanco'
)
BEGIN
    CREATE INDEX [IX_SENsores_SEN_CONId] ON [SENsores] ([SEN_CONId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251008004741_CriandoBanco'
)
BEGIN
    CREATE INDEX [IX_TELemetrias_TEL_SENId] ON [TELemetrias] ([TEL_SENId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251008004741_CriandoBanco'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251008004741_CriandoBanco', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251008222037_AddRefreshTokens'
)
BEGIN
    CREATE TABLE [REFreshTokens] (
        [ID] int NOT NULL IDENTITY,
        [REF_USUId] int NOT NULL,
        [REFToken] nvarchar(500) NOT NULL,
        [REFExpiracao] datetime2 NOT NULL,
        [REFCriadoEm] datetime2 NOT NULL,
        [REFRevogado] bit NOT NULL,
        CONSTRAINT [PK_REFreshTokens] PRIMARY KEY ([ID]),
        CONSTRAINT [FK_REFreshTokens_USUarios_REF_USUId] FOREIGN KEY ([REF_USUId]) REFERENCES [USUarios] ([ID]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251008222037_AddRefreshTokens'
)
BEGIN
    CREATE INDEX [IX_REFreshTokens_REF_USUId] ON [REFreshTokens] ([REF_USUId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251008222037_AddRefreshTokens'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251008222037_AddRefreshTokens', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251011154117_AdicionarColunaConAtivo'
)
BEGIN
    ALTER TABLE [CONdominios] ADD [CONAtivo] bit NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251011154117_AdicionarColunaConAtivo'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251011154117_AdicionarColunaConAtivo', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251103214050_AdicionarCondominioIdEmUsuarios2'
)
BEGIN
    ALTER TABLE [USUarios] ADD [USU_CONId] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251103214050_AdicionarCondominioIdEmUsuarios2'
)
BEGIN
    CREATE INDEX [IX_USUarios_USU_CONId] ON [USUarios] ([USU_CONId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251103214050_AdicionarCondominioIdEmUsuarios2'
)
BEGIN
    ALTER TABLE [USUarios] ADD CONSTRAINT [FK_USUarios_CONdominios_USU_CONId] FOREIGN KEY ([USU_CONId]) REFERENCES [CONdominios] ([ID]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251103214050_AdicionarCondominioIdEmUsuarios2'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251103214050_AdicionarCondominioIdEmUsuarios2', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251103220812_AdicionarLocalizacaoEmSensores'
)
BEGIN
    ALTER TABLE [SENsores] ADD [SENLatitude] decimal(10,8) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251103220812_AdicionarLocalizacaoEmSensores'
)
BEGIN
    ALTER TABLE [SENsores] ADD [SENLongitude] decimal(11,8) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251103220812_AdicionarLocalizacaoEmSensores'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251103220812_AdicionarLocalizacaoEmSensores', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251104002958_AdicionarCepEmCondominios'
)
BEGIN
    ALTER TABLE [CONdominios] ADD [CONCep] nvarchar(9) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251104002958_AdicionarCepEmCondominios'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251104002958_AdicionarCepEmCondominios', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251106174838_AddSessionFieldsToProvisionamentos'
)
BEGIN
    DECLARE @var0 sysname;
    SELECT @var0 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SENsores]') AND [c].[name] = N'SENCriadoEm');
    IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [SENsores] DROP CONSTRAINT [' + @var0 + '];');
    EXEC(N'UPDATE [SENsores] SET [SENCriadoEm] = ''0001-01-01T00:00:00.0000000'' WHERE [SENCriadoEm] IS NULL');
    ALTER TABLE [SENsores] ALTER COLUMN [SENCriadoEm] datetime2 NOT NULL;
    ALTER TABLE [SENsores] ADD DEFAULT '0001-01-01T00:00:00.0000000' FOR [SENCriadoEm];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251106174838_AddSessionFieldsToProvisionamentos'
)
BEGIN
    ALTER TABLE [SENsores] ADD [SENNome] nvarchar(100) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251106174838_AddSessionFieldsToProvisionamentos'
)
BEGIN
    ALTER TABLE [PROvisionamentos] ADD [PROSessionExpires] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251106174838_AddSessionFieldsToProvisionamentos'
)
BEGIN
    ALTER TABLE [PROvisionamentos] ADD [PROSessionToken] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251106174838_AddSessionFieldsToProvisionamentos'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251106174838_AddSessionFieldsToProvisionamentos', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251106193047_RemoverRequiredWifiCredentials'
)
BEGIN
    DECLARE @var1 sysname;
    SELECT @var1 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[PROvisionamentos]') AND [c].[name] = N'PROSsidCriptografado');
    IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [PROvisionamentos] DROP CONSTRAINT [' + @var1 + '];');
    ALTER TABLE [PROvisionamentos] ALTER COLUMN [PROSsidCriptografado] nvarchar(512) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251106193047_RemoverRequiredWifiCredentials'
)
BEGIN
    DECLARE @var2 sysname;
    SELECT @var2 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[PROvisionamentos]') AND [c].[name] = N'PROSenhaWifiCriptografada');
    IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [PROvisionamentos] DROP CONSTRAINT [' + @var2 + '];');
    ALTER TABLE [PROvisionamentos] ALTER COLUMN [PROSenhaWifiCriptografada] nvarchar(1024) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251106193047_RemoverRequiredWifiCredentials'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251106193047_RemoverRequiredWifiCredentials', N'8.0.8');
END;
GO

COMMIT;
GO

