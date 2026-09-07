-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 04-09-2026 a las 22:15:17
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `sweet_ice`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `carritos`
--

CREATE TABLE `carritos` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `carritos`
--

INSERT INTO `carritos` (`id`, `usuario_id`, `creado_en`) VALUES
(1, 3, '2026-08-18 21:50:08'),
(2, 4, '2026-08-21 21:36:59'),
(4, 6, '2026-08-25 01:00:13'),
(5, 8, '2026-08-25 02:41:53'),
(6, 9, '2026-08-25 21:26:41'),
(7, 10, '2026-08-26 00:45:45'),
(8, 11, '2026-09-03 21:42:34');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `carrito_items`
--

CREATE TABLE `carrito_items` (
  `id` int(11) NOT NULL,
  `carrito_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 1,
  `agregado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `carrito_items`
--

INSERT INTO `carrito_items` (`id`, `carrito_id`, `producto_id`, `cantidad`, `agregado_en`) VALUES
(6, 1, 1, 1, '2026-08-18 22:01:11');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `nombre` varchar(60) NOT NULL,
  `apellido` varchar(60) NOT NULL,
  `tipo_documento` enum('CC','TI','CE','PA') NOT NULL,
  `numero_documento` varchar(20) NOT NULL,
  `direccion` varchar(150) NOT NULL,
  `telefono` varchar(15) NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `clientes`
--

INSERT INTO `clientes` (`id`, `usuario_id`, `nombre`, `apellido`, `tipo_documento`, `numero_documento`, `direccion`, `telefono`, `creado_en`) VALUES
(1, 3, 'Samu', 'Garcia', 'TI', '896531236', 'calle 34 # 23 -13', '1234567987', '2026-08-18 21:50:08'),
(2, 4, 'Juanita', 'roman', 'TI', '15500808', 'calle 23 # 43 - 45', '3197825869', '2026-08-21 21:36:59'),
(4, 6, 'Admin', 'Sweet Ice', 'CC', '1000000000', 'Copacabana - Antioquia', '3000000000', '2026-08-25 01:00:13'),
(5, 8, 'Ana', 'Serna', 'TI', '1020312031', 'CASA  REJAS BLANCAS, 051048', '3226457896', '2026-08-25 02:41:53'),
(6, 9, 'Jhan', 'Muñoz', 'CC', '412596374', 'calle 23 # 34-45', '1283455232', '2026-08-25 21:26:41'),
(7, 10, 'Lina', 'Serna', 'CC', '1035417639', 'calle 34 # 45 -89', '3052308632', '2026-08-26 00:45:45'),
(8, 11, 'Jhon', 'Velez', 'CC', '1033650430', 'Betulia', '3142318657', '2026-09-03 02:22:53'),
(9, 12, 'Ana', 'Deossa', 'TI', '1033491791', 'VEREDA PEÑOLCITO', '3246472708', '2026-09-04 02:25:04'),
(10, 13, 'Prueba', 'Postman', 'CC', '9999999999', 'Calle de prueba 123', '3009999999', '2026-09-04 19:29:26');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedidos`
--

CREATE TABLE `pedidos` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `estado` enum('pendiente','en_proceso','entregado','cancelado') NOT NULL DEFAULT 'pendiente',
  `total` decimal(10,2) NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `pedidos`
--

INSERT INTO `pedidos` (`id`, `usuario_id`, `estado`, `total`, `creado_en`, `actualizado_en`) VALUES
(1, 4, 'pendiente', 41500.00, '2026-08-24 21:11:11', '2026-08-25 02:40:02'),
(2, 9, 'pendiente', 6000.00, '2026-08-25 21:27:49', '2026-08-25 21:27:49'),
(3, 10, 'pendiente', 11500.00, '2026-08-26 00:51:43', '2026-08-26 00:51:43'),
(4, 11, 'pendiente', 6000.00, '2026-09-04 01:47:06', '2026-09-04 19:41:21');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedido_items`
--

CREATE TABLE `pedido_items` (
  `id` int(11) NOT NULL,
  `pedido_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `nombre_producto` varchar(60) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `cantidad` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `pedido_items`
--

INSERT INTO `pedido_items` (`id`, `pedido_id`, `producto_id`, `nombre_producto`, `precio_unitario`, `cantidad`) VALUES
(1, 1, 2, 'Vainilla', 5500.00, 3),
(2, 1, 8, 'Mora', 6500.00, 1),
(3, 1, 7, 'Limón', 6000.00, 1),
(4, 1, 6, 'Café', 6500.00, 1),
(5, 1, 5, 'Mango', 6000.00, 1),
(6, 2, 3, 'Fresa', 6000.00, 1),
(7, 3, 2, 'Vainilla', 5500.00, 1),
(8, 3, 3, 'Fresa', 6000.00, 1),
(9, 4, 3, 'Fresa', 6000.00, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedido_servicios`
--

CREATE TABLE `pedido_servicios` (
  `id` int(11) NOT NULL,
  `pedido_id` int(11) NOT NULL,
  `servicio_id` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id` int(11) NOT NULL,
  `slug` varchar(40) NOT NULL,
  `nombre` varchar(60) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `imagen_url` varchar(255) DEFAULT NULL,
  `disponible` tinyint(1) DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id`, `slug`, `nombre`, `descripcion`, `precio`, `imagen_url`, `disponible`, `creado_en`) VALUES
(1, 'chocolate', 'Chocolate', 'Delicioso helado cremoso con un intenso sabor a chocolate.', 6000.00, '/img/helado1.jpeg', 1, '2026-08-18 21:20:59'),
(2, 'vainilla', 'Vainilla', 'Un clásico suave y cremoso perfecto para cualquier momento.', 5500.00, '/img/helado4.jpg', 1, '2026-08-18 21:20:59'),
(3, 'fresa', 'Fresa', 'Refrescante helado con un delicioso sabor a fresa.', 6000.00, '/img/helado5.jpg', 1, '2026-08-18 21:20:59'),
(4, 'oreo', 'Oreo', 'Cremoso helado acompañado de deliciosos trozos de galleta.', 7000.00, '/img/helado2.jpg', 1, '2026-08-18 21:20:59'),
(5, 'mango', 'Mango', 'Un sabor tropical y refrescante para disfrutar en cualquier ocasión.', 6000.00, '/img/helado6.jpg', 1, '2026-08-18 21:20:59'),
(6, 'cafe', 'Café', 'La combinación perfecta entre café y helado cremoso.', 6500.00, '/img/helado7.jpg', 1, '2026-08-18 21:20:59'),
(7, 'limon', 'Limón', 'Un sabor fresco y cítrico ideal para los días calurosos.', 6000.00, '/img/helado9.jpg', 1, '2026-08-18 21:20:59'),
(8, 'mora', 'Mora', 'Delicioso helado con el sabor dulce y natural de la mora.', 6500.00, '/img/helado10.jpg', 1, '2026-08-18 21:20:59'),
(9, 'coco', 'Coco', 'Suave y cremoso helado con un delicioso sabor a coco.', 6500.00, '/img/helado8.jpg', 1, '2026-08-18 21:20:59'),
(10, 'especial', 'Especial', 'Una combinación especial creada para los amantes de los helados.', 7500.00, '/img/helado3.jpg', 1, '2026-08-18 21:20:59');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `servicios`
--

CREATE TABLE `servicios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(60) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `precio` decimal(10,2) DEFAULT 0.00,
  `disponible` tinyint(1) DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `servicios`
--

INSERT INTO `servicios` (`id`, `nombre`, `descripcion`, `precio`, `disponible`, `creado_en`) VALUES
(1, 'Domicilio', 'Entrega a domicilio dentro de Copacabana - Antioquia.', 3000.00, 1, '2026-08-22 02:42:10'),
(2, 'Personalización de pedido', 'Combina sabores y toppings a tu gusto para eventos u ocasiones especiales.', 0.00, 1, '2026-08-22 02:42:10'),
(3, 'Eventos y catering', 'Servicio de helados para fiestas, matrimonios y eventos corporativos.', 0.00, 1, '2026-08-22 02:42:10');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `correo` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('cliente','empleado','administrador') NOT NULL DEFAULT 'cliente',
  `estado` enum('activo','inactivo') NOT NULL DEFAULT 'activo',
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expira` datetime DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `correo`, `password`, `rol`, `estado`, `reset_token`, `reset_token_expira`, `fecha_registro`) VALUES
(3, '', 'samu@gmail.com', '$2b$10$EJ4FcjHrp9YYZUZi1G9DtOFKBdoqVQo3BArs5Hvfkk5GWB/hCZztW', 'cliente', 'activo', NULL, NULL, '2026-08-18 21:50:08'),
(4, '', 'juanita@gmail.com', '$2b$10$PdICx8QgLSU5ruZPLhgPxe2USEWcD9OW4N195Eit5TJhdXcpOvIsy', 'empleado', 'activo', NULL, NULL, '2026-08-21 21:36:58'),
(6, '', 'admin@sweetice.com', '$2b$12$3qNaKNt58V8Y0Twu4f48x.p48Khd2H8jQ39aZHh.1NKl.tkDX.Jgy', 'administrador', 'activo', NULL, NULL, '2026-08-25 01:00:13'),
(8, '', 'deossasernaanamaria30@gmail.com', '$2b$10$6ILlMTHYHJyd0aOdnnFNSu9EDb0xVGe.IdnUarZpzzX8HHXjbVZWu', 'cliente', 'activo', '777833', '2026-09-03 21:19:35', '2026-08-25 02:41:53'),
(9, '', 'jhan@gmail.com', '$2b$10$.YLN0XN0PcRHpLH5jg0B..l8aMY02aN7lSsk0DR.uTdBC1ZpzGY9y', 'cliente', 'activo', NULL, NULL, '2026-08-25 21:26:41'),
(10, '', 'lsernagomez4@gmail.com', '$2b$10$6Zq9tNokyRF0zDzXw2Y1A.BSKa21oBZYHOKPu/yUMHgiZs1PeBLd2', 'cliente', 'activo', NULL, NULL, '2026-08-26 00:45:45'),
(11, '', 'jhoanvelezcifuentes@gmail.com', '$2b$12$DuIgknfzAwUglLOZ.r5PPuXgkP24v3lUIrQNTjHdTtYmePpdZ4tT6', 'cliente', 'activo', NULL, NULL, '2026-09-03 02:22:53'),
(12, '', 'mariadeossa24@gmail.com', '$2b$12$AXti5b8VonTmzDSVAVp.1eXQuvQTZHX9Sz1qu39yQvb/6Y1vg/x2.', 'cliente', 'activo', NULL, NULL, '2026-09-04 02:25:04'),
(13, '', 'pruebapostman@sweetice.com', '$2b$12$NqiWA3.X2VQTKmLqPX2lpucJ/GL9FTOg602S7s.ETPjRvZk/yvdDG', 'cliente', 'activo', NULL, NULL, '2026-09-04 19:29:26');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `carritos`
--
ALTER TABLE `carritos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `carrito_items`
--
ALTER TABLE `carrito_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unico_producto_por_carrito` (`carrito_id`,`producto_id`),
  ADD KEY `fk_items_producto` (`producto_id`);

--
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_id` (`usuario_id`),
  ADD UNIQUE KEY `numero_documento` (`numero_documento`);

--
-- Indices de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_pedidos_usuario` (`usuario_id`);

--
-- Indices de la tabla `pedido_items`
--
ALTER TABLE `pedido_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_items_pedido` (`pedido_id`),
  ADD KEY `fk_items_producto_pedido` (`producto_id`);

--
-- Indices de la tabla `pedido_servicios`
--
ALTER TABLE `pedido_servicios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unico_servicio_por_pedido` (`pedido_id`,`servicio_id`),
  ADD KEY `fk_pedido_servicios_servicio` (`servicio_id`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indices de la tabla `servicios`
--
ALTER TABLE `servicios`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `correo` (`correo`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `carritos`
--
ALTER TABLE `carritos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `carrito_items`
--
ALTER TABLE `carrito_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `pedido_items`
--
ALTER TABLE `pedido_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `pedido_servicios`
--
ALTER TABLE `pedido_servicios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `servicios`
--
ALTER TABLE `servicios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `carritos`
--
ALTER TABLE `carritos`
  ADD CONSTRAINT `fk_carritos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `carrito_items`
--
ALTER TABLE `carrito_items`
  ADD CONSTRAINT `fk_items_carrito` FOREIGN KEY (`carrito_id`) REFERENCES `carritos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_items_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD CONSTRAINT `fk_clientes_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD CONSTRAINT `fk_pedidos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `pedido_items`
--
ALTER TABLE `pedido_items`
  ADD CONSTRAINT `fk_items_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_items_producto_pedido` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`);

--
-- Filtros para la tabla `pedido_servicios`
--
ALTER TABLE `pedido_servicios`
  ADD CONSTRAINT `fk_pedido_servicios_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pedido_servicios_servicio` FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;