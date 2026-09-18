CREATE TABLE dbo.WorkflowDefinitions (
 DefinitionId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY, DefinitionKey NVARCHAR(80) NOT NULL,
 Version INT NOT NULL, DisplayName NVARCHAR(150) NOT NULL, InitialStateKey NVARCHAR(80) NOT NULL,
 CONSTRAINT UQ_WorkflowDefinitions_KeyVersion UNIQUE (DefinitionKey,Version)
);
CREATE TABLE dbo.WorkflowStates (
 StateId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY, DefinitionId UNIQUEIDENTIFIER NOT NULL,
 StateKey NVARCHAR(80) NOT NULL, IsTerminal BIT NOT NULL DEFAULT 0,
 CONSTRAINT FK_WorkflowStates_Definition FOREIGN KEY (DefinitionId) REFERENCES dbo.WorkflowDefinitions(DefinitionId),
 CONSTRAINT UQ_WorkflowStates_DefinitionState UNIQUE (DefinitionId,StateKey)
);
CREATE TABLE dbo.WorkflowTransitions (
 TransitionId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY, DefinitionId UNIQUEIDENTIFIER NOT NULL,
 TransitionKey NVARCHAR(80) NOT NULL, FromStateKey NVARCHAR(80) NOT NULL, ToStateKey NVARCHAR(80) NOT NULL,
 CONSTRAINT FK_WorkflowTransitions_Definition FOREIGN KEY (DefinitionId) REFERENCES dbo.WorkflowDefinitions(DefinitionId),
 CONSTRAINT UQ_WorkflowTransitions UNIQUE (DefinitionId,TransitionKey,FromStateKey)
);
CREATE TABLE dbo.WorkflowInstances (
 InstanceId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY, DefinitionId UNIQUEIDENTIFIER NOT NULL,
 CurrentStateKey NVARCHAR(80) NOT NULL, Revision BIGINT NOT NULL DEFAULT 0,
 CreatedAtUtc DATETIME2(3) NOT NULL, UpdatedAtUtc DATETIME2(3) NOT NULL,
 CONSTRAINT FK_WorkflowInstances_Definition FOREIGN KEY (DefinitionId) REFERENCES dbo.WorkflowDefinitions(DefinitionId)
);
CREATE TABLE dbo.WorkflowTransitionHistory (
 HistoryId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY, InstanceId UNIQUEIDENTIFIER NOT NULL,
 TransitionKey NVARCHAR(80) NOT NULL, FromStateKey NVARCHAR(80) NOT NULL, ToStateKey NVARCHAR(80) NOT NULL,
 ActorRef NVARCHAR(120) NOT NULL, Reason NVARCHAR(500) NULL, OccurredAtUtc DATETIME2(3) NOT NULL,
 CONSTRAINT FK_WorkflowHistory_Instance FOREIGN KEY (InstanceId) REFERENCES dbo.WorkflowInstances(InstanceId)
);
