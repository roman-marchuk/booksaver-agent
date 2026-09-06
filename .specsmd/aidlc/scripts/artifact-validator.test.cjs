const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('fs-extra');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const yaml = require('js-yaml');

const ArtifactValidator = require('./artifact-validator.cjs');
const validatorScript = path.join(__dirname, 'artifact-validator.cjs');
const statusScript = path.join(__dirname, 'status-integrity.cjs');
const boltCompleteScript = path.join(__dirname, 'bolt-complete.cjs');
const canonicalSchemaPath = path.join(__dirname, '..', 'memory-bank.yaml');

function frontmatter(values, body = '# Fixture\n') {
    return `---\n${yaml.dump(values, { lineWidth: -1, noRefs: true }).trim()}\n---\n\n${body}`;
}

async function write(file, content) {
    await fs.outputFile(file, content, 'utf8');
}

async function makeFixture(t, { secondIntent = false } = {}) {
    const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), 'booksaver-validator-'));
    t.after(() => fs.remove(sandbox));
    const bank = path.join(sandbox, 'fixture-bank');
    const schema = path.join(sandbox, 'schema.yaml');
    await write(schema, yaml.dump({
        structure: [],
        conventions: { timestamps: { format: 'ISO 8601 with time and timezone' } },
        naming: {},
        schema: {
            intents: 'memory-bank/intents/{intent-name}/',
            units: 'memory-bank/intents/{intent-name}/units/{unit-name}/',
            stories: 'memory-bank/intents/{intent-name}/units/{unit-name}/stories/',
            bolts: 'memory-bank/bolts/{bolt-id}/',
            'story-index': 'memory-bank/catalog/stories.md',
            'decision-index': 'memory-bank/standards/decisions.md'
        },
        'story-index': { enabled: true, mode: 'single-file', path: 'memory-bank/catalog/stories.md' }
    }));

    const intents = secondIntent ? ['001-alpha', '002-beta'] : ['001-alpha'];
    for (const [index, intent] of intents.entries()) {
        const unit = '001-common';
        const storyId = '001-same';
        const boltId = `${String(index + 1).padStart(3, '0')}-${intent.slice(4)}`;
        await write(path.join(bank, 'intents', intent, 'requirements.md'), frontmatter({
            intent, status: 'construction', created: '2026-09-06T12:00:00Z'
        }));
        await write(path.join(bank, 'intents', intent, 'units', unit, 'unit-brief.md'), frontmatter({
            intent, unit, status: 'in-progress', created: '2026-09-06T12:00:00Z'
        }));
        await write(path.join(bank, 'intents', intent, 'units', unit, 'stories', `${storyId}.md`), frontmatter({
            id: storyId, intent, unit, status: 'in-progress', created: '2026-09-06T12:00:00Z', assigned_bolt: boltId
        }));
        await write(path.join(bank, 'bolts', boltId, 'bolt.md'), frontmatter({
            id: boltId, intent, unit, type: 'ddd-construction-bolt', status: 'in-progress',
            stories: [storyId], created: '2026-09-06T12:00:00Z', started: '2026-09-06T12:00:00Z',
            completed: null, stages_completed: []
        }));
    }
    await write(path.join(bank, 'catalog', 'stories.md'), intents.map(intent =>
        `## ${intent}\n\n| File |\n|---|\n| \`001-common/stories/001-same.md\` |`
    ).join('\n\n'));
    await write(path.join(bank, 'standards', 'decisions.md'), frontmatter({ total_decisions: 0 }, '# Decision Index\n'));
    return { sandbox, bank, schema };
}

function provenance(field, originalValue = '2026-09-06T12:06:00Z') {
    return {
        field,
        state: 'unknown',
        original_value: originalValue,
        evidence_commit: '0123456789abcdef0123456789abcdef01234567',
        evidence_committed_at: '2026-09-06T12:05:30Z',
        reason: 'Immutable recording evidence conflicts with the original value; exact historical time is unknown.'
    };
}

test('validator assumptions stay in parity with canonical naming and path formats', () => {
    const schema = yaml.load(fs.readFileSync(canonicalSchemaPath, 'utf8'), { schema: yaml.JSON_SCHEMA });
    assert.deepEqual({
        intent: schema.naming.intents.format,
        unit: schema.naming.units.format,
        story: schema.naming.stories.format,
        bolt: schema.naming.bolts.format
    }, {
        intent: '{NNN}-{intent-name}',
        unit: '{UUU}-{unit-name}',
        story: '{SSS}-{title-slug}.md',
        bolt: '{BBB}-{unit-name}/'
    });
    assert.deepEqual({
        intents: schema.schema.intents,
        units: schema.schema.units,
        stories: schema.schema.stories,
        bolts: schema.schema.bolts
    }, {
        intents: 'memory-bank/intents/{intent-name}/',
        units: 'memory-bank/intents/{intent-name}/units/{unit-name}/',
        stories: 'memory-bank/intents/{intent-name}/units/{unit-name}/stories/',
        bolts: 'memory-bank/bolts/{bolt-id}/'
    });
});

test('uses the configured memory-bank root and canonical schema paths', async t => {
    const fixture = await makeFixture(t);
    await fs.ensureDir(path.join(fixture.bank, 'intents', 'bad name'));
    const validator = new ArtifactValidator(fixture.bank, { schemaPath: fixture.schema, quiet: true });
    await validator.validateAll();
    assert.equal(validator.paths.storyIndex, path.join(fixture.bank, 'catalog', 'stories.md'));
    assert.ok(validator.results.some(result => result.rule === 'intent.folder-pattern'));
    assert.ok(validator.results.every(result => result.file.startsWith(fixture.bank)));
});

test('finds malformed and date-only timestamps inside objects and arrays', async t => {
    const fixture = await makeFixture(t);
    const bolt = path.join(fixture.bank, 'bolts', '001-alpha', 'bolt.md');
    await write(bolt, frontmatter({
        id: '001-alpha', intent: '001-alpha', unit: '001-common', status: 'in-progress', stories: ['001-same'],
        created: '2026-09-06', updated: 'garbage', started: '2026-13-06T12:00:00Z', completed: null,
        stages_completed: [{ name: 'model', completed: '2026-09-06T12:00:00.123Z' }]
    }));
    const validator = new ArtifactValidator(fixture.bank, { schemaPath: fixture.schema, quiet: true });
    await validator.validateAll();
    const timestampResults = validator.results.filter(result => result.rule.startsWith('timestamp.'));
    assert.deepEqual(timestampResults.map(result => result.severity).sort(), ['error', 'error', 'error', 'warning']);
    assert.ok(timestampResults.some(result => result.fieldPath.join('.') === 'stages_completed.0.completed'));
});

test('rejects bolt completion before its final stage and referenced test report creation', async t => {
    const fixture = await makeFixture(t);
    const bolt = path.join(fixture.bank, 'bolts', '001-alpha', 'bolt.md');
    const boltData = ArtifactValidator.extractFrontmatter(await fs.readFile(bolt, 'utf8'));
    boltData.status = 'complete';
    boltData.completed = '2026-09-06T12:05:00Z';
    boltData.stages_completed = [
        { name: 'implement', completed: '2026-09-06T12:04:00Z', artifact: 'source' },
        { name: 'test', completed: '2026-09-06T12:06:00Z', artifact: 'ddd-03-test-report.md' }
    ];
    await write(bolt, frontmatter(boltData));
    await write(path.join(path.dirname(bolt), 'ddd-03-test-report.md'), frontmatter({
        stage: 'test', bolt: '001-alpha', created: '2026-09-06T12:07:00Z'
    }));
    const validator = new ArtifactValidator(fixture.bank, { schemaPath: fixture.schema, quiet: true });
    await validator.validateAll();
    const rules = new Set(validator.results.map(result => result.rule));
    assert.ok(rules.has('bolt.completed-after-stages'));
    assert.ok(rules.has('bolt.completed-after-test-report'));
});

test('allows a later report update but still rejects a later report creation', async t => {
    const fixture = await makeFixture(t);
    const bolt = path.join(fixture.bank, 'bolts', '001-alpha', 'bolt.md');
    const report = path.join(path.dirname(bolt), 'ddd-03-test-report.md');
    const boltData = ArtifactValidator.extractFrontmatter(await fs.readFile(bolt, 'utf8'));
    boltData.status = 'complete';
    boltData.completed = '2026-09-06T12:05:00Z';
    boltData.stages_completed = [
        { name: 'test', completed: '2026-09-06T12:04:00Z', artifact: 'ddd-03-test-report.md' }
    ];
    await write(bolt, frontmatter(boltData));
    await write(report, frontmatter({
        stage: 'test', bolt: '001-alpha', updated: '2026-09-06T12:07:00Z'
    }));
    const validator = new ArtifactValidator(fixture.bank, { schemaPath: fixture.schema, quiet: true });
    await validator.validateAll();
    assert.ok(!validator.results.some(result => result.rule === 'bolt.completed-after-test-report'));

    await write(report, frontmatter({
        stage: 'test', bolt: '001-alpha', created: '2026-09-06T12:07:00Z', updated: '2026-09-06T12:08:00Z'
    }));
    await validator.validateAll();
    assert.ok(validator.results.some(result => result.rule === 'bolt.completed-after-test-report'));
});

test('warns for legacy name-only completed stages without requiring invented timestamps', async t => {
    const fixture = await makeFixture(t);
    const bolt = path.join(fixture.bank, 'bolts', '001-alpha', 'bolt.md');
    const boltData = ArtifactValidator.extractFrontmatter(await fs.readFile(bolt, 'utf8'));
    boltData.status = 'complete';
    boltData.completed = '2026-09-06T12:05:00Z';
    boltData.stages_completed = ['domain-model', 'technical-design', 'implement', 'test'];
    await write(bolt, frontmatter(boltData));
    const validator = new ArtifactValidator(fixture.bank, { schemaPath: fixture.schema, quiet: true });
    await validator.validateAll();
    assert.ok(validator.results.some(result =>
        result.rule === 'bolt.legacy-stage-chronology-unavailable' && result.severity === 'warning'
    ));
    assert.ok(!validator.results.some(result => result.rule === 'timestamp.required-or-provenanced'));
});

test('accepts explicit provenance for irreconcilable required historical timestamps', async t => {
    const fixture = await makeFixture(t);
    const bolt = path.join(fixture.bank, 'bolts', '001-alpha', 'bolt.md');
    const boltData = ArtifactValidator.extractFrontmatter(await fs.readFile(bolt, 'utf8'));
    boltData.status = 'complete';
    boltData.completed = '2026-09-06T12:05:00Z';
    boltData.stages_completed = [
        { name: 'test', completed: null, artifact: 'ddd-03-test-report.md' }
    ];
    boltData.timestamp_provenance = [provenance('stages_completed[0].completed')];
    await write(bolt, frontmatter(boltData));
    await write(path.join(path.dirname(bolt), 'ddd-03-test-report.md'), frontmatter({
        stage: 'test', bolt: '001-alpha', created: null, updated: null,
        timestamp_provenance: [
            provenance('created', '2026-09-06T12:07:00Z'),
            provenance('updated', '2026-09-06T12:08:00Z')
        ]
    }));
    const validator = new ArtifactValidator(fixture.bank, { schemaPath: fixture.schema, quiet: true });
    await validator.validateAll();
    assert.ok(!validator.results.some(result =>
        result.rule.startsWith('timestamp.provenance') ||
        result.rule === 'timestamp.required-or-provenanced' ||
        result.type === 'chronology'
    ));
});

test('rejects malformed, duplicate, and unused timestamp provenance', async t => {
    const fixture = await makeFixture(t);
    const bolt = path.join(fixture.bank, 'bolts', '001-alpha', 'bolt.md');
    const boltData = ArtifactValidator.extractFrontmatter(await fs.readFile(bolt, 'utf8'));
    boltData.status = 'complete';
    boltData.completed = null;
    boltData.stages_completed = [
        { name: 'implement' },
        { name: 'test', completed: null, artifact: 'missing-report.md' }
    ];
    const duplicate = provenance('stages_completed[1].completed');
    boltData.timestamp_provenance = [duplicate, { ...duplicate }];
    await write(bolt, frontmatter(boltData));
    const story = path.join(fixture.bank, 'intents', '001-alpha', 'units', '001-common', 'stories', '001-same.md');
    const storyData = ArtifactValidator.extractFrontmatter(await fs.readFile(story, 'utf8'));
    storyData.timestamp_provenance = [
        { field: 'created', state: 'unknown' },
        provenance('status'),
        provenance('missing_at'),
        provenance('created')
    ];
    await write(story, frontmatter(storyData));
    const validator = new ArtifactValidator(fixture.bank, { schemaPath: fixture.schema, quiet: true });
    await validator.validateAll();
    const rules = new Set(validator.results.map(result => result.rule));
    assert.ok(rules.has('timestamp.provenance-shape'));
    assert.ok(rules.has('timestamp.provenance-unused'));
    assert.ok(rules.has('timestamp.provenance-missing-target'));
    assert.ok(rules.has('timestamp.provenance-null-target'));
    assert.ok(rules.has('timestamp.provenance-duplicate'));
    assert.ok(rules.has('timestamp.required-or-provenanced'));
    const requiredFields = validator.results
        .filter(result => result.rule === 'timestamp.required-or-provenanced')
        .map(result => result.fieldPath);
    assert.ok(requiredFields.includes('completed'));
    assert.ok(requiredFields.includes('stages_completed[0].completed'));
    assert.ok(requiredFields.includes('stages_completed[1].completed'));
});

test('validates decision index totals, unique references, and ADR identity', async t => {
    const fixture = await makeFixture(t);
    const adr = path.join(fixture.bank, 'bolts', '001-alpha', 'adr-001-choice.md');
    await write(adr, frontmatter({ id: 'ADR-001', created: '2026-09-06T12:00:00Z' }, '# ADR-001\n'));
    await write(path.join(fixture.bank, 'standards', 'decisions.md'), frontmatter({ total_decisions: 2 }, [
        '# Decision Index',
        '### ADR-002: Wrong heading',
        '- **Paths**: `bolts/001-alpha/adr-001-choice.md` and `bolts/001-alpha/adr-001-choice.md`'
    ].join('\n')));
    const validator = new ArtifactValidator(fixture.bank, { schemaPath: fixture.schema, quiet: true });
    await validator.validateAll();
    const rules = new Set(validator.results.map(result => result.rule));
    assert.ok(rules.has('decision-index.identity'));
    assert.ok(rules.has('decision-index.unique-membership'));
    assert.ok(rules.has('decision-index.total-decisions'));
});

test('validates index references, uniqueness, and complete membership', async t => {
    const fixture = await makeFixture(t);
    await write(path.join(fixture.bank, 'intents', '001-alpha', 'units', '001-common', 'stories', '002-unlisted.md'), frontmatter({
        id: '002-unlisted', intent: '001-alpha', unit: '001-common', created: '2026-09-06T12:00:00Z'
    }));
    await write(path.join(fixture.bank, 'catalog', 'stories.md'), [
        '## 001-alpha',
        '`001-common/stories/001-same.md`',
        '`001-common/stories/001-same.md`',
        '`001-common/stories/999-stale.md`'
    ].join('\n'));
    const validator = new ArtifactValidator(fixture.bank, { schemaPath: fixture.schema, quiet: true });
    await validator.validateAll();
    const rules = new Set(validator.results.map(result => result.rule));
    assert.ok(rules.has('story-index.reference-exists'));
    assert.ok(rules.has('story-index.unique-membership'));
    assert.ok(rules.has('story-index.membership'));
});

test('checks story and bolt identity as an intent-unit tuple', async t => {
    const fixture = await makeFixture(t, { secondIntent: true });
    const story = path.join(fixture.bank, 'intents', '001-alpha', 'units', '001-common', 'stories', '001-same.md');
    await write(story, frontmatter({
        id: '001-same', intent: '002-beta', unit: '001-common', status: 'in-progress',
        created: '2026-09-06T12:00:00Z', assigned_bolt: '002-beta'
    }));
    await write(path.join(fixture.bank, 'catalog', 'stories.md'), [
        '## 001-alpha',
        '### 001-common',
        '`intents/002-beta/units/001-common/stories/001-same.md`',
        '## 002-beta',
        '### 001-common',
        '`001-common/stories/001-same.md`'
    ].join('\n'));
    const validator = new ArtifactValidator(fixture.bank, { schemaPath: fixture.schema, quiet: true });
    await validator.validateAll();
    const rules = new Set(validator.results.map(result => result.rule));
    assert.ok(rules.has('story.scope-matches-path'));
    assert.ok(rules.has('story.scope-matches-bolt'));
    assert.ok(rules.has('story.assigned-bolt-membership'));
    assert.ok(rules.has('story-index.scope-reference'));
});

test('--fix updates a nested timestamp, revalidates, and exits on residual errors', async t => {
    const fixture = await makeFixture(t);
    const bolt = path.join(fixture.bank, 'bolts', '001-alpha', 'bolt.md');
    const story = path.join(fixture.bank, 'intents', '001-alpha', 'units', '001-common', 'stories', '001-same.md');
    const boltData = yaml.load((await fs.readFile(bolt, 'utf8')).match(/^---\n([\s\S]+?)\n---/)[1], { schema: yaml.JSON_SCHEMA });
    boltData.stories.push('999-missing');
    boltData.stages_completed = [{ name: 'model', completed: '2026-09-06T12:00:00.123Z' }];
    await write(bolt, frontmatter(boltData));
    const storyData = yaml.load((await fs.readFile(story, 'utf8')).match(/^---\n([\s\S]+?)\n---/)[1], { schema: yaml.JSON_SCHEMA });
    storyData.id = 'wrong-id';
    await write(story, frontmatter(storyData));

    const result = spawnSync(process.execPath, [validatorScript, '--fix', '--json', '--memory-bank', fixture.bank, '--schema', fixture.schema], {
        encoding: 'utf8'
    });
    assert.equal(result.status, 1);
    const report = JSON.parse(result.stdout);
    assert.equal(report.summary.fixed, 2);
    assert.ok(report.results.some(item => item.rule === 'bolt.story-exists'));
    assert.ok(!report.results.some(item => item.rule === 'story.id-matches-filename'));
    assert.ok(!report.results.some(item => item.rule === 'timestamp.no-milliseconds'));
    const fixedBolt = ArtifactValidator.extractFrontmatter(await fs.readFile(bolt, 'utf8'));
    const fixedStory = ArtifactValidator.extractFrontmatter(await fs.readFile(story, 'utf8'));
    assert.equal(fixedBolt.stages_completed[0].completed, '2026-09-06T12:00:00Z');
    assert.equal(fixedStory.id, '001-same');
});

test('status integrity does not mix same-named units from different intents', async t => {
    const fixture = await makeFixture(t, { secondIntent: true });
    const states = [
        ['001-alpha', '001-alpha', 'complete', 'complete', 'complete'],
        ['002-beta', '002-beta', 'planned', 'stories-defined', 'units-defined']
    ];
    for (const [intent, boltId, boltStatus, unitStatus, intentStatus] of states) {
        const boltPath = path.join(fixture.bank, 'bolts', boltId, 'bolt.md');
        const boltData = ArtifactValidator.extractFrontmatter(await fs.readFile(boltPath, 'utf8'));
        boltData.status = boltStatus;
        await write(boltPath, frontmatter(boltData));
        const storyPath = path.join(fixture.bank, 'intents', intent, 'units', '001-common', 'stories', '001-same.md');
        const storyData = ArtifactValidator.extractFrontmatter(await fs.readFile(storyPath, 'utf8'));
        if (boltStatus === 'complete') { storyData.status = 'complete'; storyData.implemented = true; }
        await write(storyPath, frontmatter(storyData));
        const unitPath = path.join(fixture.bank, 'intents', intent, 'units', '001-common', 'unit-brief.md');
        const unitData = ArtifactValidator.extractFrontmatter(await fs.readFile(unitPath, 'utf8'));
        unitData.status = unitStatus;
        await write(unitPath, frontmatter(unitData));
        const requirementsPath = path.join(fixture.bank, 'intents', intent, 'requirements.md');
        const requirementsData = ArtifactValidator.extractFrontmatter(await fs.readFile(requirementsPath, 'utf8'));
        requirementsData.status = intentStatus;
        await write(requirementsPath, frontmatter(requirementsData));
    }
    fs.renameSync(fixture.bank, path.join(fixture.sandbox, 'memory-bank'));
    const output = execFileSync(process.execPath, [statusScript], { cwd: fixture.sandbox, encoding: 'utf8' });
    assert.match(output, /All statuses are consistent/);
});

test('status integrity --fix exits nonzero when an unfixable error remains', async t => {
    const fixture = await makeFixture(t);
    const boltPath = path.join(fixture.bank, 'bolts', '001-alpha', 'bolt.md');
    const boltData = ArtifactValidator.extractFrontmatter(await fs.readFile(boltPath, 'utf8'));
    boltData.status = 'complete';
    boltData.stories = ['999-missing'];
    await write(boltPath, frontmatter(boltData));
    fs.renameSync(fixture.bank, path.join(fixture.sandbox, 'memory-bank'));
    const result = spawnSync(process.execPath, [statusScript, '--fix'], {
        cwd: fixture.sandbox, encoding: 'utf8'
    });
    assert.equal(result.status, 1);
    assert.match(result.stdout, /file not found/i);
});

test('bolt completion scopes same-named units by intent', async t => {
    const fixture = await makeFixture(t, { secondIntent: true });
    fs.renameSync(fixture.bank, path.join(fixture.sandbox, 'memory-bank'));
    execFileSync(process.execPath, [boltCompleteScript, '001-alpha', '--last-stage', 'test'], {
        cwd: fixture.sandbox, encoding: 'utf8'
    });
    const alphaUnit = ArtifactValidator.extractFrontmatter(await fs.readFile(
        path.join(fixture.sandbox, 'memory-bank', 'intents', '001-alpha', 'units', '001-common', 'unit-brief.md'),
        'utf8'
    ));
    const betaUnit = ArtifactValidator.extractFrontmatter(await fs.readFile(
        path.join(fixture.sandbox, 'memory-bank', 'intents', '002-beta', 'units', '001-common', 'unit-brief.md'),
        'utf8'
    ));
    assert.equal(alphaUnit.status, 'complete');
    assert.equal(betaUnit.status, 'in-progress');
    const completedBolt = await fs.readFile(
        path.join(fixture.sandbox, 'memory-bank', 'bolts', '001-alpha', 'bolt.md'), 'utf8'
    );
    assert.match(completedBolt, /created: ["']?2026-09-06T12:00:00Z["']?/);
    assert.doesNotMatch(completedBolt, /created: 2026-09-06T12:00:00\.000Z/);
    const completedBoltData = ArtifactValidator.extractFrontmatter(completedBolt);
    assert.equal(completedBoltData.stages_completed.at(-1).name, 'test');
});
