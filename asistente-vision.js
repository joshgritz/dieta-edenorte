// asistente-vision.js - El cerebro del Asistente Edenorte
import { calcularDeuda } from './firebase-logic.js';
import { db, storage } from './firebase-config.js';
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Función principal: Procesa la foto del comprobante
 */
export const procesarComprobante = async (userId, file) => {
    try {
        console.log("Analizando comprobante...");

        // 1. Subir la foto a Firebase Storage (para tener el respaldo)
        const storageRef = ref(storage, `comprobantes/${userId}_${Date.now()}`);
        await uploadBytes(storageRef, file);
        const urlFoto = await getDownloadURL(storageRef);

        // 2. Llamada a la IA para "leer" la imagen
        // Aquí simulamos la lectura de la IA (puedes conectar Gemini API aquí)
        // La IA nos devolverá el monto detectado en el papel
        const montoDetectado = await leerMontoConIA(urlFoto); 

        if (!montoDetectado) throw new Error("No se pudo leer el monto");

        // 3. Registrar el pago en la colección de 'pagos'
        await addDoc(collection(db, "pagos"), {
            usuarioId: userId,
            monto: montoDetectado,
            fecha: new Date().toISOString(),
            comprobanteUrl: urlFoto,
            verificado: false // Para que tú lo revises después
        });

        // 4. Recalcular la deuda total
        const nuevoBalance = await calcularDeuda(userId);

        return {
            mensaje: `✅ ¡Recibido! He registrado tu pago de $${montoDetectado}.`,
            detalle: `Tu balance actual es: $${nuevoBalance.totalDietas} (Total) - $${nuevoBalance.totalPagos} (Pagos).`,
            faltaPagar: `Te falta por pagar: $${nuevoBalance.pendiente}`,
            balance: nuevoBalance
        };

    } catch (error) {
        console.error("Error en el asistente:", error);
        return { mensaje: "❌ No pude procesar la imagen. Intenta que se vea más clara." };
    }
};

// Función auxiliar que conectaremos con la API de Visión
async function leerMontoConIA(urlImagen) {
    // Aquí iría el fetch a la API de Gemini o Claude Vision
    // Por ahora, devolvemos un valor de prueba para que veas cómo funciona
    return 150.00; 
}
