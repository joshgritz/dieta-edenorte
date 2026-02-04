// asistente-vision.js - Versión Final con API de Gemini Integrada
import { calcularDeuda } from './firebase-logic.js';
import { db, storage } from './firebase-config.js';
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Función principal: Se activa al subir el comprobante en el Asistente Edenorte
 */
export const procesarComprobante = async (userId, file) => {
    try {
        console.log("Asistente Edenorte: Analizando recibo con IA...");

        // 1. Guardar la imagen en el Storage de Firebase
        const storageRef = ref(storage, `comprobantes/${userId}_${Date.now()}`);
        await uploadBytes(storageRef, file);
        const urlFoto = await getDownloadURL(storageRef);

        // 2. Preparar la imagen para la IA
        const base64Image = await fileToBase64(file);

        // 3. Llamar a Gemini para extraer el monto
        const montoDetectado = await leerMontoConGemini(base64Image); 

        if (!montoDetectado || isNaN(montoDetectado) || montoDetectado === 0) {
            throw new Error("No se pudo leer un monto claro en la imagen.");
        }

        // 4. Registrar el pago en Firestore
        await addDoc(collection(db, "pagos"), {
            usuarioId: userId,
            monto: montoDetectado,
            fecha: new Date().toISOString(),
            comprobanteUrl: urlFoto,
            verificado: false
        });

        // 5. Calcular cuánto falta por pagar ahora
        const nuevoBalance = await calcularDeuda(userId);

        return {
            exito: true,
            mensaje: `✅ ¡Pago detectado! He anotado $${montoDetectado}.`,
            pendiente: `Balance actual: Te faltan RD$${nuevoBalance.pendiente} por pagar.`,
            datos: nuevoBalance
        };

    } catch (error) {
        console.error("Error en el Asistente:", error);
        return { 
            exito: false, 
            mensaje: "❌ No pude procesar el pago. Asegúrate de que el monto se vea claro en la foto." 
        };
    }
};

/**
 * Conexión directa con tu API de Gemini
 */
async function leerMontoConGemini(base64Data) {
    // Usando tu clave proporcionada
    const API_KEY = "AIzaSyBQ4SVnih-vmdzl1gYjR8Mb1s8ExL8zWIE"; 
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: "Eres un contable. Mira este recibo de pago y dime SOLAMENTE el número del monto total. No digas palabras, solo el número (ejemplo: 1500)." },
                    { inline_data: { mime_type: "image/jpeg", data: base64Data } }
                ]
            }]
        })
    });

    const data = await response.json();
    
    if (data.candidates && data.candidates[0].content.parts[0].text) {
        const texto = data.candidates[0].content.parts[0].text;
        // Limpiar símbolos de peso o comas y convertir a número
        return parseFloat(texto.replace(/[^0-9.]/g, ''));
    }
    return 0;
}

/**
 * Convierte el archivo del celular a formato de lectura para la IA
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}
