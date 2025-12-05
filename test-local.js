// Script para testar a função localmente
require('dotenv').config({ path: __dirname + '/.env.dev' });

// Mock do BasicIO e Context
const mockBasicIO = {
    arguments: {
        tipoNota: 'nfe',
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
        cursor: '',  // String vazia ao invés de null
        isV2: 'false'
    },
    
    getArgument(key) {
        return this.arguments[key];
    },
    
    getAllArguments() {
        return this.arguments;
    },
    
    write(data) {
        console.log('\n=== RESPONSE ===');
        console.log(data);
        console.log('================\n');
    },
    
    setStatus(code) {
        console.log(`Status Code: ${code}`);
    }
};

const mockContext = {
    catalystHeaders: {},
    
    close() {
        console.log('Context closed');
    },
    
    getRemainingExecutionTimeMs() {
        return 60000;
    },
    
    getMaxExecutionTimeMs() {
        return 60000;
    }
};

// Executa a função
const handler = require('./index.js');

console.log('Iniciando teste da função Catalyst...\n');
console.log('Argumentos:', mockBasicIO.arguments);
console.log('\n');

handler(mockContext, mockBasicIO)
    .then(() => {
        console.log('\nFunção executada com sucesso!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\nErro ao executar função:', error);
        process.exit(1);
    });
