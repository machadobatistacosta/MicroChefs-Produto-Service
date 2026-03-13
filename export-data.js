const http = require('http');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3002';

function makeRequest(method, path, body = null, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_URL + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, data: json });
                } catch {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.setTimeout(timeout, () => {
            req.destroy();
            reject(new Error(`Timeout após ${timeout}ms`));
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function exportData() {
    console.log('\n\x1b[36m═════════════════════════════════════════\x1b[0m');
    console.log('\x1b[36m           EXPORTAR DADOS EM JSON\x1b[0m');
    console.log('\x1b[36m═════════════════════════════════════════\x1b[0m\n');

    try {
        console.log('\x1b[33m[*] Buscando dados do servidor...\x1b[0m');

        // Buscar produtos e categorias
        const [produtosRes, categoriasRes] = await Promise.all([
            makeRequest('GET', '/api/produtos?limite=100'),
            makeRequest('GET', '/api/categorias')
        ]);

        const exportData = {
            timestamp: new Date().toISOString(),
            produtos: produtosRes.data.dados || [],
            categorias: categoriasRes.data.dados || [],
            resumo: {
                totalProdutos: produtosRes.data.quantidade || 0,
                totalCategorias: categoriasRes.data.quantidade || 0
            }
        };

        // Salvar arquivo
        const filename = `dados-export-${Date.now()}.json`;
        const filepath = path.join(__dirname, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2), 'utf-8');

        console.log(`\x1b[32m✓ Dados exportados com sucesso!\x1b[0m`);
        console.log(`\x1b[33m[*] Arquivo: ${filename}\x1b[0m`);
        console.log(`\x1b[33m[*] Tamanho: ${fs.statSync(filepath).size} bytes\x1b[0m\n`);

        // Resumo
        console.log('\x1b[36m═════════════════════════════════════════\x1b[0m');
        console.log(`\x1b[32mProdutos: ${exportData.resumo.totalProdutos}\x1b[0m`);
        console.log(`\x1b[32mCategorias: ${exportData.resumo.totalCategorias}\x1b[0m`);
        console.log('\x1b[36m═════════════════════════════════════════\x1b[0m\n');

    } catch (err) {
        console.error(`\x1b[31m✗ Erro: ${err.message}\x1b[0m\n`);
        process.exit(1);
    }
}

exportData();
