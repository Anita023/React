-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: sweet_ice
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `carrito_items`
--

DROP TABLE IF EXISTS `carrito_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `carrito_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `carrito_id` int(11) NOT NULL,
  `producto_id` int(11) DEFAULT NULL,
  `servicio_id` int(11) DEFAULT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 1,
  `agregado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unico_producto_por_carrito` (`carrito_id`,`producto_id`),
  UNIQUE KEY `unico_servicio_por_carrito` (`carrito_id`,`servicio_id`),
  KEY `fk_items_producto` (`producto_id`),
  KEY `fk_carrito_items_servicio` (`servicio_id`),
  CONSTRAINT `fk_carrito_items_servicio` FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_items_carrito` FOREIGN KEY (`carrito_id`) REFERENCES `carritos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_items_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carrito_items`
--

LOCK TABLES `carrito_items` WRITE;
/*!40000 ALTER TABLE `carrito_items` DISABLE KEYS */;
INSERT INTO `carrito_items` VALUES (6,1,1,NULL,1,'2026-08-18 22:01:11');
/*!40000 ALTER TABLE `carrito_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carritos`
--

DROP TABLE IF EXISTS `carritos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `carritos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `fk_carritos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carritos`
--

LOCK TABLES `carritos` WRITE;
/*!40000 ALTER TABLE `carritos` DISABLE KEYS */;
INSERT INTO `carritos` VALUES (1,3,'2026-08-18 21:50:08'),(2,4,'2026-08-21 21:36:59'),(4,6,'2026-08-25 01:00:13'),(5,8,'2026-08-25 02:41:53'),(6,9,'2026-08-25 21:26:41'),(7,10,'2026-08-26 00:45:45'),(8,11,'2026-09-03 21:42:34'),(9,12,'2026-09-06 02:56:07'),(10,14,'2026-09-07 21:28:08'),(11,16,'2026-09-08 17:18:46'),(12,18,'2026-09-21 01:37:27');
/*!40000 ALTER TABLE `carritos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `clientes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `nombre` varchar(60) NOT NULL,
  `apellido` varchar(60) NOT NULL,
  `tipo_documento` enum('CC','TI','CE','PA') NOT NULL,
  `numero_documento` varchar(20) NOT NULL,
  `direccion` varchar(150) NOT NULL,
  `telefono` varchar(15) NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`),
  UNIQUE KEY `numero_documento` (`numero_documento`),
  CONSTRAINT `fk_clientes_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES (1,3,'Samu','Garcia','TI','896531236','calle 34 # 23 -13','1234567987','2026-08-18 21:50:08'),(2,4,'Juanita','roman','TI','15500808','calle 23 # 43 - 45','3197825869','2026-08-21 21:36:59'),(4,6,'Admin','Sweet Ice','CC','1000000000','Copacabana - Antioquia','3000000000','2026-08-25 01:00:13'),(5,8,'Ana','Serna','TI','1020312031','CASA  REJAS BLANCAS, 051048','3226457896','2026-08-25 02:41:53'),(6,9,'Jhan','Muñoz','CC','412596374','calle 23 # 34-45','1283455232','2026-08-25 21:26:41'),(7,10,'Lina','Serna','CC','1035417639','calle 34 # 45 -89','3052308632','2026-08-26 00:45:45'),(8,11,'Jhon','Velez','CC','1033650430','Betulia','3142318657','2026-09-03 02:22:53'),(9,12,'Ana','Deossa','TI','1033491791','VEREDA PEÑOLCITO','3246472708','2026-09-04 02:25:04'),(11,14,'Juan','Rodriguez','CC','1425637851','calle 34 # 56 -90','3254789632','2026-09-07 21:27:33'),(12,16,'Melani','Ferreira','TI','1091360606','calle 10 #20-40','3102350900','2026-09-08 17:17:43'),(13,17,'Ana','Serna','CC','1129585520','CASA  REJAS BLANCAS, 051048','3197825896','2026-09-11 21:45:09'),(14,18,'Maria','Serna','CC','104272525224','calle 345 - b452','3214785900','2026-09-21 01:36:38');
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversaciones`
--

DROP TABLE IF EXISTS `conversaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `conversaciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) DEFAULT NULL,
  `creado_en` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `ix_conversaciones_id` (`id`),
  CONSTRAINT `conversaciones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversaciones`
--

LOCK TABLES `conversaciones` WRITE;
/*!40000 ALTER TABLE `conversaciones` DISABLE KEYS */;
INSERT INTO `conversaciones` VALUES (1,NULL,'2026-09-15 23:12:25'),(2,NULL,'2026-09-15 23:17:36'),(3,NULL,'2026-09-15 23:20:27'),(4,NULL,'2026-09-15 23:53:20'),(5,NULL,'2026-09-15 23:56:57'),(6,NULL,'2026-09-15 23:57:58'),(7,12,'2026-09-16 00:09:36'),(8,NULL,'2026-09-16 16:23:33'),(9,NULL,'2026-09-16 16:27:45'),(10,6,'2026-09-16 20:43:42'),(11,NULL,'2026-09-16 20:44:13'),(12,NULL,'2026-09-16 20:44:44'),(13,NULL,'2026-09-17 16:49:37'),(14,NULL,'2026-09-17 16:49:49');
/*!40000 ALTER TABLE `conversaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_facturas`
--

DROP TABLE IF EXISTS `detalle_facturas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `detalle_facturas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `factura_id` int(11) NOT NULL,
  `nombre_item` varchar(60) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `factura_id` (`factura_id`),
  KEY `ix_detalle_facturas_id` (`id`),
  CONSTRAINT `detalle_facturas_ibfk_1` FOREIGN KEY (`factura_id`) REFERENCES `facturas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_facturas`
--

LOCK TABLES `detalle_facturas` WRITE;
/*!40000 ALTER TABLE `detalle_facturas` DISABLE KEYS */;
INSERT INTO `detalle_facturas` VALUES (1,1,'Chocolate',2,6000.00,12000.00),(2,2,'Limón',1,6000.00,6000.00),(3,2,'Chocolate',1,6000.00,6000.00),(4,2,'Domicilio',1,3000.00,3000.00);
/*!40000 ALTER TABLE `detalle_facturas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_ventas`
--

DROP TABLE IF EXISTS `detalle_ventas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `detalle_ventas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `venta_id` int(11) NOT NULL,
  `producto_id` int(11) DEFAULT NULL,
  `servicio_id` int(11) DEFAULT NULL,
  `nombre_item` varchar(60) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `venta_id` (`venta_id`),
  KEY `producto_id` (`producto_id`),
  KEY `servicio_id` (`servicio_id`),
  KEY `ix_detalle_ventas_id` (`id`),
  CONSTRAINT `detalle_ventas_ibfk_1` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `detalle_ventas_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`),
  CONSTRAINT `detalle_ventas_ibfk_3` FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_ventas`
--

LOCK TABLES `detalle_ventas` WRITE;
/*!40000 ALTER TABLE `detalle_ventas` DISABLE KEYS */;
INSERT INTO `detalle_ventas` VALUES (1,1,1,NULL,'Chocolate',2,6000.00,12000.00),(2,2,7,NULL,'Limón',1,6000.00,6000.00),(3,2,1,NULL,'Chocolate',1,6000.00,6000.00),(4,2,NULL,1,'Domicilio',1,3000.00,3000.00);
/*!40000 ALTER TABLE `detalle_ventas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `facturas`
--

DROP TABLE IF EXISTS `facturas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `facturas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `venta_id` int(11) NOT NULL,
  `numero_factura` varchar(20) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `impuestos` decimal(10,2) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `estado` enum('emitida','anulada') NOT NULL,
  `creado_en` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `venta_id` (`venta_id`),
  UNIQUE KEY `numero_factura` (`numero_factura`),
  KEY `ix_facturas_id` (`id`),
  CONSTRAINT `facturas_ibfk_1` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facturas`
--

LOCK TABLES `facturas` WRITE;
/*!40000 ALTER TABLE `facturas` DISABLE KEYS */;
INSERT INTO `facturas` VALUES (1,1,'FAC-000001',12000.00,0.00,12000.00,'emitida','2026-09-14 21:25:53'),(2,2,'FAC-000002',15000.00,0.00,15000.00,'emitida','2026-09-17 01:56:58');
/*!40000 ALTER TABLE `facturas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mensajes`
--

DROP TABLE IF EXISTS `mensajes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mensajes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `conversacion_id` int(11) NOT NULL,
  `rol` enum('usuario','asistente') NOT NULL,
  `contenido` text NOT NULL,
  `creado_en` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `conversacion_id` (`conversacion_id`),
  KEY `ix_mensajes_id` (`id`),
  CONSTRAINT `mensajes_ibfk_1` FOREIGN KEY (`conversacion_id`) REFERENCES `conversaciones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mensajes`
--

LOCK TABLES `mensajes` WRITE;
/*!40000 ALTER TABLE `mensajes` DISABLE KEYS */;
INSERT INTO `mensajes` VALUES (1,1,'usuario','Hola, ¿qué sabores de helado tienen?','2026-09-15 23:12:25'),(2,2,'usuario','Hola, ¿qué sabores de helado tienen?','2026-09-15 23:17:36'),(3,3,'usuario','Hola, ¿qué sabores de helado tienen?','2026-09-15 23:20:27'),(4,4,'usuario','Hola, ¿qué sabores de helado tienen?','2026-09-15 23:53:20'),(5,5,'usuario','Hola, ¿qué sabores de helado tienen?','2026-09-15 23:56:57'),(6,5,'asistente','No made-up flavors?* Checked, didn\'t invent specific','2026-09-15 23:57:01'),(7,6,'usuario','Hola, ¿qué sabores de helado tienen?','2026-09-15 23:57:58'),(8,6,'asistente','¡Hola! En Sweet Ice tenemos una gran variedad de helados artesanales, desde los clásicos como chocolate y vainilla, hasta opciones frutales y de la casa. \n\nTe invito a explorar nuestra sección de \"Helados\" en la página web para ver todos los sabores disponibles y sus precios actualizados. ¡Seguro encontrarás tu favorito! 🍨✨','2026-09-15 23:58:00'),(9,6,'usuario','¿Y hacen pedidos a domicilio?','2026-09-15 23:59:46'),(10,6,'asistente','¡Sí, claro! Llevamos tus postres y helados favoritos hasta la puerta de tu casa. \n\nPara hacer tu pedido, solo debes agregar los productos al carrito en nuestra página web, iniciar sesión y seguir los pasos para el pago. ¡Es súper fácil y rápido! 🍦🚚','2026-09-15 23:59:49'),(11,7,'usuario','hola, que productos tienes ?','2026-09-16 00:09:36'),(12,7,'asistente','¡Hola! ✨ En Sweet Ice ofrecemos una deliciosa variedad de helados artesanales, tortas, postres individuales y productos de pastelería para toda ocasión. \n\nTe invito a explorar nuestro catálogo completo directamente en el sitio web para conocer todos los sabores disponibles. ¿Buscas algo en especial para hoy? 🍦🍰','2026-09-16 00:09:45'),(13,7,'usuario','Que sabores de helados manejas ?','2026-09-16 00:10:01'),(14,7,'asistente','¡Hola de nuevo! ✨ Manejamos una gran variedad de sabores, desde los clásicos como chocolate y vainilla, hasta opciones frutales y de la casa. \n\nComo nuestro menú va cambiando, te sugiero revisar la sección de helados en nuestro sitio web para ver los sabores disponibles hoy con sus precios exactos. ¡Seguro encuentras tu favorito! 🍦😋','2026-09-16 00:10:03'),(15,7,'usuario','Okey muchas gracias','2026-09-16 00:11:19'),(16,7,'asistente','¡Con mucho gusto! 😊 Aquí estaré si necesitas ayuda para hacer tu pedido o si tienes alguna otra duda. \n\n¡Que tengas un dulce día y disfrutes tu compra! 🍦🍰✨','2026-09-16 00:11:22'),(17,8,'usuario','quiero saber sobre los productos','2026-09-16 16:23:34'),(18,9,'usuario','hola','2026-09-16 16:27:45'),(19,9,'asistente','¡Hola! 😊 Bienvenido a Sweet Ice. ¿En qué te puedo ayudar hoy? Puedo orientarte con nuestros productos, cómo realizar tu pedido en la web o resolver cualquier duda que tengas. ¡Dime qué se te antoja! 🍦🍰','2026-09-16 16:27:47'),(20,10,'usuario','SOY NUEOV EN EL PLANTAFORMA Y QUIERO Q ME EXPLQIEUS SU USO','2026-09-16 20:43:42'),(21,11,'usuario','SOY NUEOV EN EL PLANTAFORMA Y QUIERO Q ME EXPLQIEUS SU USO Error al conectar con el servicio de IA:','2026-09-16 20:44:13'),(22,11,'asistente','¡Hola! Bienvenid@ a **Sweet Ice**, qué alegría tenerte por aquí. 🍦🍰\n\nUsar nuestra plataforma es muy fácil: solo explora nuestros productos, elige tus helados o postres favoritos y agrégalos al carrito. Cuando estés listo, ve al carrito, inicia sesión o regístrate, ingresa tu dirección y elige tu método de pago para finalizar tu pedido.\n\nSi necesitas ayuda con algo más o tienes alguna duda, ¡aquí estaré para guiarte!','2026-09-16 20:44:42'),(23,12,'usuario','hola','2026-09-16 20:44:44'),(24,12,'asistente','¡Hola! 👋 Bienvenido a Sweet Ice. ¿En qué te puedo ayudar hoy? Puedo orientarte con nuestros helados y postres, ayudarte a hacer un pedido o resolver tus dudas. ✨','2026-09-16 20:44:45'),(25,12,'usuario','soy nueva puedes ayudarme a utilizar la platafroma','2026-09-16 20:45:02'),(26,12,'asistente','¡Claro que sí, bienvenida a la familia Sweet Ice! 🍦✨ \n\nEs muy fácil: navega por nuestro menú, elige tus helados o postres favoritos y agrégalos al carrito. Cuando estés lista, entra al carrito, inicia sesión con tu cuenta, ingresa tu dirección de entrega y elige tu método de pago. ¡Y listo, nosotros te lo llevamos! 😉','2026-09-16 20:45:06'),(27,12,'usuario','ooooooooooo es demasiado sencillo por lo que veo','2026-09-16 20:45:37'),(28,12,'asistente','¡Así es! Queremos que pedir tus antojos sea tan dulce y rápido como comerlos. 😋🍰 \n\nSi necesitas ayuda buscando algún producto o tienes alguna duda durante tu compra, ¡aquí estaré para ayudarte!','2026-09-16 20:45:39'),(29,12,'usuario','que ´productos tienen disponible?','2026-09-16 20:46:41'),(30,12,'asistente','¡Tenemos opciones deliciosas! 🍨🍰 En Sweet Ice ofrecemos una gran variedad de helados artesanales, paletas, tortas, postres individuales y malteadas. \n\nTe invito a explorar el catálogo completo en nuestro sitio web para ver todos los sabores disponibles hoy. ¡Seguro se te hará la boca agua! 😋✨','2026-09-16 20:46:43'),(31,12,'usuario','Tiene suero','2026-09-16 20:50:29'),(32,12,'asistente','Por el momento no manejamos suero. En Sweet Ice somos especialistas en helados artesanales, tortas y postres deliciosos. 🍦🍰 \n\nTe invito a revisar nuestro menú en la web para que conozcas todas las opciones dulces que tenemos disponibles para ti. ✨','2026-09-16 20:50:36'),(33,13,'usuario','hola pagina','2026-09-17 16:49:37'),(34,14,'usuario','hola pagina','2026-09-17 16:49:49');
/*!40000 ALTER TABLE `mensajes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pedido_items`
--

DROP TABLE IF EXISTS `pedido_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pedido_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pedido_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `nombre_producto` varchar(60) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `cantidad` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_items_pedido` (`pedido_id`),
  KEY `fk_items_producto_pedido` (`producto_id`),
  CONSTRAINT `fk_items_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_items_producto_pedido` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedido_items`
--

LOCK TABLES `pedido_items` WRITE;
/*!40000 ALTER TABLE `pedido_items` DISABLE KEYS */;
INSERT INTO `pedido_items` VALUES (1,1,2,'Vainilla',5500.00,3),(2,1,8,'Mora',6500.00,1),(3,1,7,'Limón',6000.00,1),(4,1,6,'Café',6500.00,1),(5,1,5,'Mango',6000.00,1),(6,2,3,'Fresa',6000.00,1),(7,3,2,'Vainilla',5500.00,1),(8,3,3,'Fresa',6000.00,1),(9,4,3,'Fresa',6000.00,1),(10,5,2,'Vainilla',5500.00,1),(11,5,3,'Fresa',6000.00,1),(12,6,4,'Oreo',7000.00,8),(13,7,2,'Vainilla',5500.00,1),(14,8,2,'Vainilla',5500.00,1),(15,9,2,'Vainilla',5500.00,1),(16,10,2,'Vainilla',5500.00,1),(17,10,10,'Especial',7500.00,1),(18,11,4,'Oreo',7000.00,1),(19,12,3,'Fresa',6000.00,2),(20,13,4,'Oreo',7000.00,1),(21,14,7,'Limón',6000.00,1),(22,14,5,'Mango',6000.00,1),(23,14,2,'Vainilla',5500.00,1),(24,14,4,'Oreo',7000.00,1),(25,14,16,'brownie',7500.00,1),(26,16,2,'Vainilla',5500.00,1),(27,16,3,'Fresa',6000.00,1);
/*!40000 ALTER TABLE `pedido_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pedido_servicios`
--

DROP TABLE IF EXISTS `pedido_servicios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pedido_servicios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pedido_id` int(11) NOT NULL,
  `servicio_id` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unico_servicio_por_pedido` (`pedido_id`,`servicio_id`),
  KEY `fk_pedido_servicios_servicio` (`servicio_id`),
  CONSTRAINT `fk_pedido_servicios_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pedido_servicios_servicio` FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedido_servicios`
--

LOCK TABLES `pedido_servicios` WRITE;
/*!40000 ALTER TABLE `pedido_servicios` DISABLE KEYS */;
INSERT INTO `pedido_servicios` VALUES (1,15,1,6000.00),(2,15,3,0.00),(3,15,2,0.00),(4,16,1,3000.00);
/*!40000 ALTER TABLE `pedido_servicios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pedidos`
--

DROP TABLE IF EXISTS `pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pedidos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `estado` enum('pendiente','en_proceso','entregado','cancelado') NOT NULL DEFAULT 'pendiente',
  `metodo_pago` enum('efectivo','tarjeta','transferencia') NOT NULL DEFAULT 'efectivo',
  `total` decimal(10,2) NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_pedidos_usuario` (`usuario_id`),
  CONSTRAINT `fk_pedidos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedidos`
--

LOCK TABLES `pedidos` WRITE;
/*!40000 ALTER TABLE `pedidos` DISABLE KEYS */;
INSERT INTO `pedidos` VALUES (1,4,'entregado','efectivo',41500.00,'2026-08-24 21:11:11','2026-09-14 20:08:08'),(2,9,'en_proceso','efectivo',6000.00,'2026-08-25 21:27:49','2026-09-14 20:08:14'),(3,10,'entregado','efectivo',11500.00,'2026-08-26 00:51:43','2026-09-14 20:08:18'),(4,11,'en_proceso','efectivo',6000.00,'2026-09-04 01:47:06','2026-09-07 21:32:53'),(5,12,'cancelado','tarjeta',11500.00,'2026-09-06 02:56:24','2026-09-14 20:08:30'),(6,12,'pendiente','transferencia',56000.00,'2026-09-06 03:00:25','2026-09-06 03:00:25'),(7,14,'pendiente','transferencia',5500.00,'2026-09-07 21:28:57','2026-09-07 21:28:57'),(8,12,'pendiente','efectivo',5500.00,'2026-09-08 07:12:05','2026-09-08 07:12:05'),(9,16,'pendiente','tarjeta',5500.00,'2026-09-08 17:19:07','2026-09-08 17:19:07'),(10,12,'entregado','efectivo',13000.00,'2026-09-08 20:14:20','2026-09-16 00:25:23'),(11,12,'entregado','transferencia',7000.00,'2026-09-11 20:18:18','2026-09-16 20:36:41'),(12,12,'entregado','tarjeta',12000.00,'2026-09-11 21:15:11','2026-09-16 00:25:20'),(13,12,'entregado','tarjeta',7000.00,'2026-09-16 00:22:29','2026-09-16 20:36:38'),(14,12,'pendiente','transferencia',32000.00,'2026-09-17 01:52:34','2026-09-17 01:52:34'),(15,12,'pendiente','efectivo',6000.00,'2026-09-21 00:41:13','2026-09-21 00:41:13'),(16,18,'pendiente','efectivo',14500.00,'2026-09-21 01:37:42','2026-09-21 01:37:42');
/*!40000 ALTER TABLE `pedidos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pqr`
--

DROP TABLE IF EXISTS `pqr`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pqr` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `tipo` enum('peticion','queja','reclamo','sugerencia') NOT NULL,
  `asunto` varchar(120) NOT NULL,
  `descripcion` text NOT NULL,
  `estado` enum('pendiente','en_proceso','respondida','cerrada') NOT NULL,
  `respuesta` text DEFAULT NULL,
  `respondido_por` int(11) DEFAULT NULL,
  `creado_en` timestamp NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `respondido_por` (`respondido_por`),
  KEY `ix_pqr_id` (`id`),
  CONSTRAINT `pqr_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pqr_ibfk_2` FOREIGN KEY (`respondido_por`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pqr`
--

LOCK TABLES `pqr` WRITE;
/*!40000 ALTER TABLE `pqr` DISABLE KEYS */;
INSERT INTO `pqr` VALUES (1,12,'queja','Demora en la entrega','Mi pedido llegó una hora tarde sin aviso previo.','respondida','se presnto un inconveniente disculpa',6,'2026-09-15 01:52:22','2026-09-17 01:58:44'),(2,12,'reclamo','Caro el domi ','Por que me cobraron tan caro el domicilio era cerca y me cobraron demas','en_proceso',NULL,NULL,'2026-09-17 01:51:58','2026-09-17 01:57:31'),(3,18,'peticion','Caro el domi ','Azsxdcfgvbhjnkmlkjihuygtfrdesazsdxfghjnkm','respondida','Ok perdon, no entedemos su peticion \n',6,'2026-09-21 01:38:23','2026-09-21 01:39:28');
/*!40000 ALTER TABLE `pqr` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productos`
--

DROP TABLE IF EXISTS `productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `productos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slug` varchar(40) NOT NULL,
  `nombre` varchar(60) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `imagen_url` varchar(255) DEFAULT NULL,
  `disponible` tinyint(1) DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
INSERT INTO `productos` VALUES (1,'chocolate','Chocolate','Delicioso helado cremoso con un intenso sabor a chocolate.',6000.00,'/img/helado1.jpeg',1,'2026-08-18 21:20:59'),(2,'vainilla','Vainilla','Un clásico suave y cremoso perfecto para cualquier momento.',5500.00,'/img/helado4.jpg',1,'2026-08-18 21:20:59'),(3,'fresa','Fresa','Refrescante helado con un delicioso sabor a fresa.',6000.00,'/img/helado5.jpg',1,'2026-08-18 21:20:59'),(4,'oreo','Oreo','Cremoso helado acompañado de deliciosos trozos de galleta.',7000.00,'/img/helado2.jpg',1,'2026-08-18 21:20:59'),(5,'mango','Mango','Un sabor tropical y refrescante para disfrutar en cualquier ocasión.',6000.00,'/img/helado6.jpg',1,'2026-08-18 21:20:59'),(6,'cafe','Café','La combinación perfecta entre café y helado cremoso.',6500.00,'/img/helado7.jpg',1,'2026-08-18 21:20:59'),(7,'limon','Limón','Un sabor fresco y cítrico ideal para los días calurosos.',6000.00,'/img/helado9.jpg',1,'2026-08-18 21:20:59'),(8,'mora','Mora','Delicioso helado con el sabor dulce y natural de la mora.',6500.00,'/img/helado10.jpg',1,'2026-08-18 21:20:59'),(9,'coco','Coco','Suave y cremoso helado con un delicioso sabor a coco.',6500.00,'/img/helado8.jpg',1,'2026-08-18 21:20:59'),(10,'especial','Especial','Una combinación especial creada para los amantes de los helados.',7500.00,'/img/helado3.jpg',1,'2026-08-18 21:20:59'),(16,'brownie','brownie','rico muy economico \n',7500.00,'/uploads/productos/98daaee8eae04fca95170505e75c5423.png',1,'2026-09-13 21:56:42');
/*!40000 ALTER TABLE `productos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `servicios`
--

DROP TABLE IF EXISTS `servicios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `servicios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(60) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `precio` decimal(10,2) DEFAULT 0.00,
  `disponible` tinyint(1) DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `servicios`
--

LOCK TABLES `servicios` WRITE;
/*!40000 ALTER TABLE `servicios` DISABLE KEYS */;
INSERT INTO `servicios` VALUES (1,'Domicilio','Entrega a domicilio dentro de Copacabana - Antioquia.',3000.00,1,'2026-08-22 02:42:10'),(2,'Personalización de pedido','Combina sabores y toppings a tu gusto para eventos u ocasiones especiales.',0.00,1,'2026-08-22 02:42:10'),(3,'Eventos y catering','Servicio de helados para fiestas, matrimonios y eventos corporativos.',0.00,1,'2026-08-22 02:42:10');
/*!40000 ALTER TABLE `servicios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `correo` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('cliente','empleado','administrador') NOT NULL DEFAULT 'cliente',
  `estado` enum('activo','inactivo') NOT NULL DEFAULT 'activo',
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expira` datetime DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `correo` (`correo`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (3,'','samu@gmail.com','$2b$10$EJ4FcjHrp9YYZUZi1G9DtOFKBdoqVQo3BArs5Hvfkk5GWB/hCZztW','empleado','activo',NULL,NULL,'2026-08-18 21:50:08'),(4,'','juanita@gmail.com','$2b$10$PdICx8QgLSU5ruZPLhgPxe2USEWcD9OW4N195Eit5TJhdXcpOvIsy','empleado','activo',NULL,NULL,'2026-08-21 21:36:58'),(6,'','admin@sweetice.com','$2b$12$3qNaKNt58V8Y0Twu4f48x.p48Khd2H8jQ39aZHh.1NKl.tkDX.Jgy','administrador','activo',NULL,NULL,'2026-08-25 01:00:13'),(8,'','deossasernaanamaria30@gmail.com','$2b$10$6ILlMTHYHJyd0aOdnnFNSu9EDb0xVGe.IdnUarZpzzX8HHXjbVZWu','cliente','activo','777833','2026-09-03 21:19:35','2026-08-25 02:41:53'),(9,'','jhan@gmail.com','$2b$10$.YLN0XN0PcRHpLH5jg0B..l8aMY02aN7lSsk0DR.uTdBC1ZpzGY9y','cliente','activo',NULL,NULL,'2026-08-25 21:26:41'),(10,'','lsernagomez4@gmail.com','$2b$10$6Zq9tNokyRF0zDzXw2Y1A.BSKa21oBZYHOKPu/yUMHgiZs1PeBLd2','cliente','activo',NULL,NULL,'2026-08-26 00:45:45'),(11,'','jhoanvelezcifuentes@gmail.com','$2b$12$DuIgknfzAwUglLOZ.r5PPuXgkP24v3lUIrQNTjHdTtYmePpdZ4tT6','cliente','activo',NULL,NULL,'2026-09-03 02:22:53'),(12,'','mariadeossa24@gmail.com','$2b$12$AXti5b8VonTmzDSVAVp.1eXQuvQTZHX9Sz1qu39yQvb/6Y1vg/x2.','cliente','activo',NULL,NULL,'2026-09-04 02:25:04'),(14,'','Juan@gmail.com','$2b$12$TR2jDos9IloaCqkiSPWCVOUPR.X1kWcanjNGWd45zZd.4JA.3E8eu','cliente','activo',NULL,NULL,'2026-09-07 21:27:33'),(15,'sara mazo','sara@gmail.com','$2b$12$uGpA1SM64MKH/fV3/QWhjuNaRze5/ssYxIL.tL5rN1h96Fp9JHcFC','cliente','activo',NULL,NULL,'2026-09-08 07:14:12'),(16,'','melaniferreira52@gmail.com','$2b$12$uXYJsUBxdI0GNy.RslxJDOWqLLNdNRomAEciHDRMEWQWpRGFr0ipe','cliente','activo',NULL,NULL,'2026-09-08 17:17:43'),(17,'','adeossa23@gmail.com','$2b$12$/U1VkWExDzvMn02qeyC0PeH9IHh.61msqTWEZnEaT2.yOaSnSlj86','empleado','activo',NULL,NULL,'2026-09-11 21:45:09'),(18,'','anadeossa4@gmail.com','$2b$12$vBKDCAM6ALACuNUpK0Fd0eYMBWpwdOExwArsOkuZ6p7UcRBWmQiAe','cliente','activo',NULL,NULL,'2026-09-21 01:36:38');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ventas`
--

DROP TABLE IF EXISTS `ventas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ventas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cliente_id` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `pedido_id` int(11) DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `descuento` decimal(10,2) NOT NULL,
  `impuestos` decimal(10,2) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `estado` enum('pendiente','completada','anulada') NOT NULL,
  `creado_en` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `pedido_id` (`pedido_id`),
  KEY `cliente_id` (`cliente_id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `ix_ventas_id` (`id`),
  CONSTRAINT `ventas_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `ventas_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `ventas_ibfk_3` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ventas`
--

LOCK TABLES `ventas` WRITE;
/*!40000 ALTER TABLE `ventas` DISABLE KEYS */;
INSERT INTO `ventas` VALUES (1,1,6,NULL,12000.00,0.00,0.00,12000.00,'completada','2026-09-14 21:12:53'),(2,9,6,NULL,15000.00,0.00,0.00,15000.00,'completada','2026-09-17 01:56:34');
/*!40000 ALTER TABLE `ventas` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-20 23:43:17
