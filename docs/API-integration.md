# API integration

The PDF generator is using the OpenShift internal routing. This means any API request made from the PDF generator pods to other services within the cluster requires the service hostname and network access to the service pods.

## Hostname config

The service hostname is accessible from the Clowder config. In order to expose the hostname, additional entry to config needs to be added. Add desired service name to **optionalDependencies** array to the `deploy/clowdapp.yml` file:

```diff
diff --git a/deploy/clowdapp.yml b/deploy/clowdapp.yml
index e703293..dc8cfbf 100644
--- a/deploy/clowdapp.yml
+++ b/deploy/clowdapp.yml
@@ -19,6 +19,7 @@ objects:
     optionalDependencies:
     - ros-backend
     - chrome-service
+    - service-name
     deployments:
     - name: api
       minReplicas: ${{MIN_REPLICAS}}

```

## Network access

To allow the PDF generator access to internal service API, a network policy has to be added to the service config. Within the service namespace configurations update the `networkPoliciesAllow` list. **Production and stage** policies are usually separate.

- stage policy ref: `- $ref: /services/insights/crc-pdf-generator/namespaces/crc-pdf-generator-stage.yml`
- prod policy ref: `- $ref: /services/insights/crc-pdf-generator/namespaces/crc-pdf-generator-prod.yml`

Sample of updated network policy:

```yaml
networkPoliciesAllow:
  # rest of your policies
  - $ref: /services/insights/crc-pdf-generator/namespaces/crc-pdf-generator-stage.yml
```

## Next steps

With API integrated, you can lean about [Local development setup](./local-development-setup.md)
