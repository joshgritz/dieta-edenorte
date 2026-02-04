// firebase-logic.js - Gestión de Dietas y Pagos
import { db } from './firebase-config'; // Tu configuración de Firebase
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

// FÓRMULA DE BALANCE:
// El balance pendiente se calcula como:
// $$Balance = \sum(Precio Dietas) - \sum(Pagos Realizados)$$

export const calcularDeuda = async (userId) => {
    try {
        // 1. Obtener todas las dietas hechas
        const dietasRef = collection(db, "dietas");
        const qDietas = query(dietasRef, where("usuarioId", "==", userId));
        const snapshotDietas = await getDocs(qDietas);
        let totalDietas = 0;
        snapshotDietas.forEach(doc => totalDietas += doc.data().precio);

        // 2. Obtener todos los pagos realizados
        const pagosRef = collection(db, "pagos");
        const qPagos = query(pagosRef, where("usuarioId", "==", userId));
        const snapshotPagos = await getDocs(qPagos);
        let totalPagos = 0;
        snapshotPagos.forEach(doc => totalPagos += doc.data().monto);

        const pendiente = totalDietas - totalPagos;

        return {
            totalDietas,
            totalPagos,
            pendiente,
            estado: pendiente <= 0 ? "Al día" : "Pendiente de pago"
        };
    } catch (error) {
        console.error("Error calculando balance:", error);
        return null;
    }
};

/**
 * Función para que el Chatbot registre una nueva dieta automáticamente
 */
export const registrarDietaDesdeChatbot = async (userId, datosDieta) => {
    // datosDieta vendrá de lo que el chatbot "lea" del archivo que le mandes
    return await addDoc(collection(db, "dietas"), {
        usuarioId: userId,
        nombre: datosDieta.nombre,
        precio: datosDieta.precio,
        fecha: new Date().toISOString(),
        detalles: datosDieta.contenido
    });
};
  
