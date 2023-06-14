import {parse} from 'https://deno.land/std@0.119.0/flags/mod.ts';
import * as yaml from 'https://deno.land/x/js_yaml_port/js-yaml.js';

const h_flags = parse(Deno.args, {
	string: ['format'],
	default: {
		format: 'json',
	},
});

const si_format = h_flags.format;


const H_RESPONSE_CODES = {
	400: {
		description: 'Invalid input',
	},
	403: {
		description: 'User not authorized',
	},
	404: {
		description: 'Resource not found',
	},
	412: {
		description: 'Precondition failed',
	},
};


const H_CONTENT_TURTLE = {
	'text/turtle': {
		schema: {
			type: 'string',
			example: '@prefix : <https://ex.org/#> . :subject :predicate :object .',
		},
	},
};

const H_CONTENT_SPARQL_QUERY = {
	'application/sparql-query': {
		schema: {
			type: 'string',
			example: 'select * { ?s ?p ?o } limit 10',
		},
	},
};

const H_CONTENT_SPARQL_UPDATE = {
	'application/sparql-update': {
		schema: {
			type: 'string',
			example: 'prefix : <https://ex.org/#> insert data { :subject :predicate :object }',
		},
	},
};

const G_RESPONSE_GRAPH = {
	content: {
		...H_CONTENT_TURTLE,
	},
};

const SI_TAG_STRUCTURAL_READS = 'structural reads';
const SI_TAG_STRUCTURAL_WRITES = 'structural writes';
const SI_TAG_MODEL_QUERIES = 'model queries';
const SI_TAG_MODEL_COMMITS = 'model commits';
const SI_TAG_VERSION_CONTROL = 'version control';
const SI_TAG_ACCESS_CONTROL = 'access control';

const P_EXAMPLE = 'https://example.org';

const strip_indent = (sx_code: string) => {
	let s_indentation = '';
	let n_shortest = Infinity;

	const a_lines = sx_code.split(/\n/g);
	for(const s_line of a_lines) {
		if(!s_line.trim()) continue;

		const s_indent = /^(\s*)/.exec(s_line)[1];
		const nl_indent = s_indent.length;
		if(nl_indent < n_shortest) {
			s_indentation = s_indent;
			n_shortest = nl_indent;
		}
	}

	let r_indent = new RegExp(s_indentation)
	return a_lines.map(s => s.replace(r_indent, '').trimEnd())
		.join('\n').replace(/\t/g, '    ').trim();
}

const SX_EXAMPLE_ORG = strip_indent(`
	@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
	@prefix dct: <http://purl.org/dc/terms/> .
	@prefix mms: <https://mms.openmbee.org/rdf/ontology/> .
	@prefix m-org: <${P_EXAMPLE}/orgs/> .
	
	m-org:open-mbee rdf:type mms:Org ;
		mms:id "open-mbee" ;
		dct:title "Open-MBEE"@en ;
		mms:etag "495888f7-85b8-47c5-97a0-359b35ecd6a4" .
`)+'\n\n';

const SX_EXAMPLE_REPO = strip_indent(`
	@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
	@prefix dct: <http://purl.org/dc/terms/> .
	@prefix mms: <https://mms.openmbee.org/rdf/ontology/> .
	@prefix m-org: <${P_EXAMPLE}/orgs/> .
	
	<${P_EXAMPLE}/orgs/open-mbee/repos/tmt> rdf:type mms:Repo ;
		mms:id "tmt" ;
		mms:org m-org:open-mbee ;
		dct:title "Thirty Meter Telescope"@en ;
		mms:etag "12ceed0b-6b5a-438e-aaa1-bbb004e8ee87" .
`)+'\n\n';

const SX_EXAMPLE_BRANCH = strip_indent(`
	@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
	@prefix dct: <http://purl.org/dc/terms/> .
	@prefix mms: <https://mms.openmbee.org/rdf/ontology/> .
	@prefix m-org: <${P_EXAMPLE}/orgs/> .
	
	<${P_EXAMPLE}/orgs/open-mbee/repos/tmt> rdf:type mms:Repo ;
		mms:id "tmt" ;
		mms:org m-org:open-mbee ;
		dct:title "Thirty Meter Telescope"@en ;
		mms:etag "12ceed0b-6b5a-438e-aaa1-bbb004e8ee87" .
`)+'\n\n';

const ttl_example = (sx_ttl: string) => ({
	responses: {
		200: {
			description: '',
			content: {
				'text/turtle': {
					schema: {
						type: 'string',
						example: strip_indent(sx_ttl),
					},
				},
			},
		},
		...H_RESPONSE_CODES,
	},
});

const g_components = {
	securitySchemes: {
		basic: {
			type: 'http',
			scheme: 'basic',
		},
		bearerAuth: {
			type: 'http',
			scheme: 'bearer',
			bearerFormat: 'JWT',
			description: 'Use a bearer token provided by the auth service at `/login`',
		},
	},
	responses: {
		HeadResource: {
			200: {},
			...H_RESPONSE_CODES,
		},
		GetResource: {
			200: G_RESPONSE_GRAPH,
			...H_RESPONSE_CODES,
		},
		Turtle: G_RESPONSE_GRAPH,
	},
};

const naturally = (si_operation: string) => ({
	operationId: si_operation,
	summary: si_operation.split(/(?=[A-Z])/g).map(s => s[0].toUpperCase()+s.slice(1)).join(' '),
});

const head_get = (si_operation: string, a_tags?: string[], sx_ttl?: string) => ({
	// head: {
	// 	operationId: `${si_operation}Etag`,
	// 	summary: `${naturally(si_operation).summary}: Headers Only`,
	// 	responses: {
	// 		$ref: '#/components/responses/HeadResource',
	// 	},
	// 	...a_tags? {tags:a_tags}: {},
	// },
	get: {
		...naturally(si_operation),
		responses: {
			$ref: '#/components/responses/GetResource',
		},
		...a_tags? {tags:a_tags}: {},
		...sx_ttl? ttl_example(sx_ttl): {},
	},
});

const put_patch = (si_base: string, a_tags?: string[]) => ({
	put: {
		...naturally(`create${si_base}`),
		responses: {
			$ref: '#/components/responses/PutResource',
		},
		...a_tags? {tags:a_tags}: {},
	},
	patch: {
		...naturally(`update${si_base}`),
		responses: {
			$ref: '#/components/responses/PatchResource',
		},
		...a_tags? {tags:a_tags}: {},
	},
});

const crud = (si_base: string, sx_ttl?: string) => ({
	...head_get('read'+si_base, [SI_TAG_STRUCTURAL_READS], sx_ttl),
	...put_patch(si_base, [SI_TAG_STRUCTURAL_WRITES]),
})

const g_sparql_query = {
	requestBody: {
		description: 'SPARQL 1.1 query string',
		required: true,
		content: {
			'application/sparql-query': {},
		},
	},

	responses: {
		$ref: '#/components/responses/GetResource',
	},
};

const g_sparql_update = {
	requestBody: {
		description: 'SPARQL 1.1 update string',
		required: true,
		content: {
			'application/sparql-update': {},
		},
	},

	responses: {
		$ref: '#/components/responses/GetResource',
	},
};

const g_rdf_turtle = {
	requestBody: {
		description: 'RDF graph content as Turtle',
		required: true,
		content: {
			...H_CONTENT_TURTLE,
		},
	},

	responses: {
		$ref: '#/components/responses/GetResource',
	},
};

const h_paths = {
	'/login': {
		get: {
			operationId: 'login',
			summary: 'Login',
			description: 'Obtain a token from the auth service',
			tags: ['getting started'],
			security: [
				{
					basicAuth: [],
				},
			],
			responses: {
				200: {},
			},
		},
	},

	'/orgs': {
		...head_get('readAllOrgs', [SI_TAG_STRUCTURAL_READS], SX_EXAMPLE_ORG+strip_indent(`
			m-org:other rdf:type mms:Org ;
				mms:id "other" ;
				dct:title "Some Other Org"@en ;
				mms:etag "bd4e72d1-0481-4eb8-b4ad-37078db4d30d" .
		`)),

		'/{orgId}': {
			...crud('Org', SX_EXAMPLE_ORG),

			'/repos': {
				...head_get('readAllRepos', [SI_TAG_STRUCTURAL_READS], SX_EXAMPLE_REPO+strip_indent(`
					<${P_EXAMPLE}/orgs/other/repos/demo> rdf:type mms:Repo ;
						mms:id "demo" ;
						mms:org m-org:other ;
						dct:title "Demo Model"@en ;
						mms:etag "bbcff498-fa18-4551-9e76-f331e190324c" .
				`)),

				'/{repoId}': {
					...crud('Repo', SX_EXAMPLE_REPO),

					'/branches': {
						...head_get('readAllBranches', [SI_TAG_STRUCTURAL_READS]),

						'/{branchId}': {
							...crud('Branch'),

							'/graph': {
								...head_get('readModel', [SI_TAG_STRUCTURAL_READS]),

								post: {
									...naturally('loadModel'),
									description: 'Replace the model at the HEAD of a branch by uploading an RDF file',
									...g_sparql_query,
									tags: [SI_TAG_MODEL_COMMITS],
								},
							},

							'/query': {
								post: {
									...naturally('queryModel'),
									description: 'Query the model at the HEAD of a branch',
									...g_sparql_query,
									tags: [SI_TAG_MODEL_QUERIES],
								},
							},

							'/update': {
								post: {
									...naturally('commitModel'),
									description: 'Commit a change to the model by applying a SPARQL UPDATE',
									...g_sparql_update,
									tags: [SI_TAG_MODEL_COMMITS],
								},
							},
						},
					},

					'/locks': {
						...head_get('readAllLocks', [SI_TAG_VERSION_CONTROL]),

						'/{lockId}': {
							...head_get('readLock', [SI_TAG_VERSION_CONTROL]),

							put: {
								...naturally('createLock'),
								...g_sparql_update,
								tags: [SI_TAG_VERSION_CONTROL],
							},

							'/query': {
								post: {
									...naturally('queryLock'),
									description: 'Query the model under the commit pointed to by the given lock',
									...g_sparql_query,
									tags: [SI_TAG_MODEL_QUERIES],
								},
							},
						},
					},

					'/diff': {
						post: {
							...naturally('createDiff'),
							...g_sparql_query,
							tags: [SI_TAG_VERSION_CONTROL],
						},

						'/query': {
							post: {
								...naturally('queryDiff'),
								description: 'Query the given diff',
								...g_sparql_query,
								tags: [SI_TAG_VERSION_CONTROL],
							},
						},
					},

					'/query': {
						post: {
							...naturally('queryRepo'),
							description: 'Query the metadata graph for the given repository',
							...g_sparql_query,
							tags: [SI_TAG_VERSION_CONTROL],
						},
					},
				},
			},

			'/collections': {
				'/{collectionId}': {
					put: {
						...naturally('createCollection'),
						...g_rdf_turtle,
						tags: [SI_TAG_STRUCTURAL_WRITES],
					},
				},
			},
		},
	},

	'/policies': {
		'/{policyId}': {
			put: {
				...naturally('createPolicy'),
				...g_rdf_turtle,
				tags: [SI_TAG_ACCESS_CONTROL],
			},
		},
	},

	'/groups': {
		'/{groupId}': {
			put: {
				...naturally('createGroup'),
				...g_rdf_turtle,
				tags: [SI_TAG_ACCESS_CONTROL],
			},
		},
	},
};

function flatten_paths(h_paths_nested, h_root={}, s_path='') {
	const h_out = {};

	for(const [si_key, z_value] of Object.entries(h_paths_nested)) {
		if('/' === si_key[0]) {
			Object.assign(h_root[s_path+si_key] = {}, flatten_paths(z_value, h_root, s_path+si_key));
		}
		else {
			h_out[si_key] = z_value;
		}
	}

	return s_path? h_out: h_root;
}

const g_spec = {
	openapi: '3.1.0',
	info: {
		title: 'MMS5 Layer 1 Service',
		description: 'OpenAPI specification for layer 1',
		license: {
			name: 'Apache 2.0',
			url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
		},
		version: '1.0.0',
	},
	paths: flatten_paths(h_paths),
	components: g_components,
	tags: [
		{
			name: 'getting started',
		},
		{
			name: SI_TAG_STRUCTURAL_READS,
		},
	],
	security: [
		{
			bearerAuth: [],
		},
	],
};

if('yaml' === si_format) {
	console.log(yaml.dump(g_spec));
}
else {
	console.log(JSON.stringify(g_spec, null, '\t'));
}
