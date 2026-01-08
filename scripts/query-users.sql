-- Lista todos los usuarios
SELECT 
    name,
    email,
    role,
    department,
    "isActive"
FROM "User"
ORDER BY "createdAt" ASC;
