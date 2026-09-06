const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const yaml = require('js-yaml');

const root = path.resolve(__dirname, '../../..');

test('Compose exposes only the opt-in TLS gateway and preserves private daemon mounts', () => {
    const config = yaml.load(fs.readFileSync(path.join(root, 'docker-compose.yml'), 'utf8'));
    const { booksaver, caddy } = config.services;
    assert.deepEqual(booksaver.ports ?? [], []);
    assert.deepEqual(new Set(booksaver.expose.map(String)), new Set(['8080', '6080']));
    assert.equal(booksaver.shm_size, '1g');
    assert.ok(booksaver.volumes.includes('./config.toml:/data/config.toml:ro'));
    assert.deepEqual(caddy.profiles, ['remote-auth']);
    assert.deepEqual(new Set(caddy.ports), new Set(['80:80', '443:443']));
    assert.equal(caddy.depends_on.booksaver.condition, 'service_healthy');
    assert.ok(caddy.volumes.includes('./Caddyfile:/etc/caddy/Caddyfile:ro'));
    assert.deepEqual(
        Object.entries(config.services).filter(([, service]) => service.ports?.length).map(([name]) => name),
        ['caddy'],
    );
});
