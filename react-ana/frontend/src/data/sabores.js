import img1 from "../assets/img/helado1.jpeg";
import img2 from "../assets/img/helado2.jpg";
import img3 from "../assets/img/helado3.jpg";
import img4 from "../assets/img/helado4.jpg";
import img5 from "../assets/img/helado5.jpg";
import img6 from "../assets/img/helado6.jpg";
import img7 from "../assets/img/helado7.jpg";
import img8 from "../assets/img/helado8.jpg";
import img9 from "../assets/img/helado9.jpg";
import img10 from "../assets/img/helado10.jpg";

// Fuente única de los sabores: el carrusel y la página de Productos
// leen de aquí, así que siempre muestran las mismas fotos y datos.
export const sabores = [
  {
    id: "chocolate",
    nombre: "Chocolate",
    titulo: "Helado de Chocolate",
    imagen: img1,
    descripcion: "Delicioso helado cremoso con un intenso sabor a chocolate.",
    precio: "$6.000"
  },
  {
    id: "vainilla",
    nombre: "Vainilla",
    titulo: "Helado de Vainilla",
    imagen: img4,
    descripcion: "Un clásico suave y cremoso perfecto para cualquier momento.",
    precio: "$5.500"
  },
  {
    id: "fresa",
    nombre: "Fresa",
    titulo: "Helado de Fresa",
    imagen: img5,
    descripcion: "Refrescante helado con un delicioso sabor a fresa.",
    precio: "$6.000"
  },
  {
    id: "oreo",
    nombre: "Oreo",
    titulo: "Helado de Oreo",
    imagen: img2,
    descripcion: "Cremoso helado acompañado de deliciosos trozos de galleta.",
    precio: "$7.000"
  },
  {
    id: "mango",
    nombre: "Mango",
    titulo: "Helado de Mango",
    imagen: img6,
    descripcion: "Un sabor tropical y refrescante para disfrutar en cualquier ocasión.",
    precio: "$6.000"
  },
  {
    id: "cafe",
    nombre: "Café",
    titulo: "Helado de Café",
    imagen: img7,
    descripcion: "La combinación perfecta entre café y helado cremoso.",
    precio: "$6.500"
  },
  {
    id: "limon",
    nombre: "Limón",
    titulo: "Helado de Limón",
    imagen: img9,
    descripcion: "Un sabor fresco y cítrico ideal para los días calurosos.",
    precio: "$6.000"
  },
  {
    id: "mora",
    nombre: "Mora",
    titulo: "Helado de Mora",
    imagen: img10,
    descripcion: "Delicioso helado con el sabor dulce y natural de la mora.",
    precio: "$6.500"
  },
  {
    id: "coco",
    nombre: "Coco",
    titulo: "Helado de Coco",
    imagen: img8,
    descripcion: "Suave y cremoso helado con un delicioso sabor a coco.",
    precio: "$6.500"
  },
  {
    id: "especial",
    nombre: "Especial",
    titulo: "Helado Especial",
    imagen: img3,
    descripcion: "Una combinación especial creada para los amantes de los helados.",
    precio: "$7.500"
  }
];
