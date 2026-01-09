-- Verificar que Company existe
SELECT * FROM "Company";

-- Verificar que usuarios tienen companyId
SELECT id, name, email, role, "companyId" FROM "User";

-- Verificar que proyectos tienen companyId
SELECT id, name, "companyId" FROM "Project";
