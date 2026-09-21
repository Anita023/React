import pymysql

# Conexión a Railway
conexion = pymysql.connect(
    host="iriguchi.proxy.rlwy.net",
    port=48547,
    user="root",
    password="AOOGdWgypiPMTxBMsuVAjsiPGcNjrDxC",
    charset="utf8mb4",
)

with conexion.cursor() as cursor:
    cursor.execute("DROP DATABASE IF EXISTS railway;")
    cursor.execute("CREATE DATABASE railway;")
    cursor.execute("USE railway;")

    # Este archivo se generó con: mysqldump ... -r sweet_ice_backup2.sql sweet_ice
    # Al usar -r, mysqldump escribe el archivo directamente en UTF-8 real,
    # sin pasar por la consola de PowerShell (que corrompía tildes y la ñ).
    with open("sweet_ice_backup2.sql", "r", encoding="utf-8") as f:
        contenido = f.read()

    # Ejecuta cada sentencia SQL del backup, una por una
    for sentencia in contenido.split(";"):
        sentencia = sentencia.strip()
        if sentencia:
            try:
                cursor.execute(sentencia)
            except Exception as e:
                print(f"Aviso al ejecutar una sentencia: {e}")

conexion.commit()
conexion.close()
print("¡Importación completada!")