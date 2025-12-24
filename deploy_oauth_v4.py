#!/usr/bin/env python3.11
import json
import subprocess
import sys

# Ler o código da função
with open('/home/ubuntu/risecheckout-84776/supabase/functions/mercadopago-oauth-callback/index.ts', 'r') as f:
    function_code = f.read()

# Preparar o input para o MCP
deploy_input = {
    "project_id": "wivbtmtgpsxupfjwwovf",
    "name": "mercadopago-oauth-callback",
    "files": [
        {
            "name": "index.ts",
            "content": function_code
        }
    ]
}

# Executar o deploy via MCP CLI
result = subprocess.run(
    ['manus-mcp-cli', 'tool', 'call', 'deploy_edge_function', '--server', 'supabase', '--input', json.dumps(deploy_input)],
    capture_output=True,
    text=True
)

print("STDOUT:")
print(result.stdout)
print("\nSTDERR:")
print(result.stderr)
print(f"\nReturn code: {result.returncode}")

sys.exit(result.returncode)
