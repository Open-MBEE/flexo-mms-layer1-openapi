# OpenAPI for MMS5 Layer 1

This repository generates an OpenAPI document defining MMS5 Layer 1's endpoints using a config script written in TypeScript.

The generated OpenAPI document can in turn be used to generate API documentation (hosted here using GitHub pages) and OpenAPI clients (although users should be aware that none of the request or response body content types are JSON, thus no schema information will be attached to the generated clients).

## [Browse the API Documentation](https://www.openmbee.org/flexo-mms-layer1-openapi/) 👈

The generated OpenAPI document is deployed as an HTML webpage using RapiDoc and GitHub pages.


## View the OpenAPI Document

If you just want to download the latest generated OpenAPI document, the files [can be found here](https://github.com/Open-MBEE/mms5-layer1-openapi/tree/build/docs/build).


## Building the OpenAPI Document

See [scripts.yaml](./scripts.yaml) for reference on how to build the OpenAPI document in JSON or YAML format from the CLI.


## Generating Clients

You can use the built OpenAPI document to generate a client in any target framework you like, using any client generator you like. [OpenAPI Generator](https://github.com/OpenAPITools/openapi-generator#1---installation) is one such tool, capable of generating clients in many different frameworks.


## Build Tool

[Velociraptor](https://velociraptor.run/) is a script runner tool for Deno that can be used to invoke the various commands in the `scripts.yaml` file:
 - `vr build` -- builds the OpenAPI document
 - `vr generate` -- generates client(s) using the built document
