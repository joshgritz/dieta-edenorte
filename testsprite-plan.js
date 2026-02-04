// Este es un plan de pruebas para TestSprite
// Objetivo: Verificar que la deuda nunca sea negativa y que el chatbot guarde bien.

const testPlan = {
  name: "Validación de Balance Edenorte",
  tests: [
    {
      name: "Prueba de Cálculo de Deuda",
      action: "Simular una dieta de $500 y un pago de $200",
      expectedResult: "El balance pendiente debe ser exactamente $300",
      type: "unit-test"
    },
    {
      name: "Prueba de Carga de Archivos",
      action: "Enviar un archivo PDF de dieta al chatbot",
      expectedResult: "Se debe crear un nuevo documento en la colección 'dietas' de Firestore",
      type: "integration-test"
    }
  ]
};

export default testPlan;
