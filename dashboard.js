const http = require('http');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3002';

function makeRequest(method, pathStr, body = null, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_URL + pathStr);
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

async function generateDashboard() {
    console.log('\n\x1b[36m═════════════════════════════════════════\x1b[0m');
    console.log('\x1b[36m        GERAR DASHBOARD HTML\x1b[0m');
    console.log('\x1b[36m═════════════════════════════════════════\x1b[0m\n');

    try {
        console.log('\x1b[33m[*] Buscando dados...\x1b[0m');

        const [produtosRes, categoriasRes] = await Promise.all([
            makeRequest('GET', '/api/produtos?limite=100'),
            makeRequest('GET', '/api/categorias')
        ]);

        const produtos = produtosRes.data.dados || [];
        const categorias = categoriasRes.data.dados || [];

        // Gerar tabelas HTML
        const produtosTableRows = produtos.map((p, idx) => `
            <tr>
                <td>${idx + 1}</td>
                <td>${p.nome}</td>
                <td>${p.descricao || '-'}</td>
                <td>R$ ${p.preco.toFixed(2)}</td>
                <td>${new Date(p.createdAt).toLocaleDateString('pt-BR')}</td>
            </tr>
        `).join('');

        const categoriasTableRows = categorias.map((c, idx) => `
            <tr>
                <td>${idx + 1}</td>
                <td>${c.nome}</td>
                <td>${new Date(c.createdAt).toLocaleDateString('pt-BR')}</td>
            </tr>
        `).join('');

        const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Microserviço de Produtos</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        header {
            background: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        h1 {
            color: #333;
            margin-bottom: 10px;
        }
        
        .meta {
            color: #666;
            font-size: 14px;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .stat-card h3 {
            font-size: 28px;
            margin-bottom: 5px;
        }
        
        .stat-card p {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .section {
            background: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .section h2 {
            color: #333;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #667eea;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th {
            background: #f8f9fa;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #333;
            border-bottom: 2px solid #ddd;
        }
        
        td {
            padding: 12px;
            border-bottom: 1px solid #eee;
        }
        
        tr:hover {
            background: #f8f9fa;
        }
        
        .status-online {
            color: #27ae60;
            font-weight: bold;
        }
        
        .empty {
            text-align: center;
            padding: 40px;
            color: #999;
        }
        
        footer {
            text-align: center;
            color: white;
            margin-top: 30px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🍔 Microserviço de Produtos</h1>
            <p class="meta">Dashboard de Dados em Tempo Real</p>
            <div class="stats">
                <div class="stat-card">
                    <h3>${produtos.length}</h3>
                    <p>Produtos Cadastrados</p>
                </div>
                <div class="stat-card">
                    <h3>${categorias.length}</h3>
                    <p>Categorias</p>
                </div>
                <div class="stat-card">
                    <h3 class="status-online">ONLINE</h3>
                    <p>Status do Servidor</p>
                </div>
            </div>
        </header>
        
        <div class="section">
            <h2>📦 Produtos</h2>
            ${produtos.length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Nome</th>
                            <th>Descrição</th>
                            <th>Preço</th>
                            <th>Data de Criação</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${produtosTableRows}
                    </tbody>
                </table>
            ` : `
                <div class="empty">Nenhum produto cadastrado</div>
            `}
        </div>
        
        <div class="section">
            <h2>🏷️ Categorias</h2>
            ${categorias.length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Nome</th>
                            <th>Data de Criação</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${categoriasTableRows}
                    </tbody>
                </table>
            ` : `
                <div class="empty">Nenhuma categoria cadastrada</div>
            `}
        </div>
        
        <footer>
            <p>Gerado em ${new Date().toLocaleString('pt-BR')} • Sistema de Restaurante v1.0</p>
        </footer>
    </div>
</body>
</html>
        `;

        const filename = 'dashboard.html';
        const filepath = path.join(__dirname, filename);
        
        fs.writeFileSync(filepath, html, 'utf-8');

        console.log(`\x1b[32m✓ Dashboard criado com sucesso!\x1b[0m`);
        console.log(`\x1b[33m[*] Arquivo: ${filename}\x1b[0m`);
        console.log(`\x1b[33m[*] Abra em seu navegador: file://${filepath}\x1b[0m\n`);

    } catch (err) {
        console.error(`\x1b[31m✗ Erro: ${err.message}\x1b[0m\n`);
        process.exit(1);
    }
}

generateDashboard();
