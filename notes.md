| Section | Secondary Page                     | Filter          | Endpoint                                            | Missing Backend Support                                                  |
| ------- | ---------------------------------- | --------------- | --------------------------------------------------- | ------------------------------------------------------------------------ |
| Demand  | Products in High Demand            | Product Name    | `GET /order-transaction/material-order-quantities/` | Multiple product-name values are not supported.                          |
| Demand  | Products in High Demand            | NDC             | `GET /order-transaction/material-order-quantities/` | NDC filtering is not supported for either a single NDC or multiple NDCs. |
| Supply  | Purchase Orders by Product         | Product Name    | `GET /purchase-order/material-lines/`               | Multiple product-name values are not supported.                          |
| Supply  | Purchase Orders by Product         | NDC             | `GET /purchase-order/material-lines/`               | Multiple NDC values and format-insensitive matching are not supported.   |
| Supply  | Purchase Orders by Product         | PO Number       | `GET /purchase-order/material-lines/`               | Multiple PO-number values are not supported.                             |
| Supply  | Products Low Outbound Line Service | Product Name    | `GET /order-transaction/fail-to-supply/materials/`  | Multiple product-name values are not supported.                          |
| Supply  | Products Low Outbound Line Service | NDC             | `GET /order-transaction/fail-to-supply/materials/`  | Multiple NDC values and format-insensitive matching are not supported.   |
| Supply  | Products Low Outbound Line Service | Material Status | `GET /order-transaction/fail-to-supply/materials/`  | Multiple material-status values are not supported.                       |

look the multiple product name should be done differently. You have the endpoint /material/ and when user writes the material name, you should list materials that match that name, and on selected ones, you should send material numbers as a list

the material number as list is supported through global filter on all endpoints

I am adding now ndc support across all apis that its POSSIBLE to support it

for material you can send:
?material=2023232,23123123,1233332

Keep in mind there are two concepts there, material id and material number.

The material id is an auto incremental integer that we use on postgres for efficient indexing while mat_nbr or material number is the actual identifier. The Data Engineering team, or actual users, they don't know what material id is, it doesn't mean anything for them, only material number does.
We support both as filters through our APIs. If you send:
?material=2023232,23123123,1233332 - This will filter on mat_nbr or Material Number
if you send:
?material_id=100,101,103 - This will filter on Material ID

---

TenantPage.tsx
line 45-50
This page never supplies or updates `limit`/`offset`, while `useTenantsQuery` defaults to 50 records at offset 0. The header can therefore report the full count while the table silently exposes only the first 50 tenants, leaving later records unavailable for viewing or CRUD operations. The same issue exists on UsersPage and both TenantDetail tables.

MultiTenantUserDrawer.tsx
line 121-128
The reviewed form submits only the email. `firstName` and `lastName` are silently discarded, and `useCreateInternalUserMutation` only calls `setTenantAccessScope` when `tenant_access_scope` is supplied. Consequently this code path does not explicitly grant the advertised all-tenant access and the created user may not appear under the `all_tenants` tab. Submit the name fields and `tenant_access_scope: "all_tenants"`.

useTenantMutations.ts
line 35-40
Adds and removals execute concurrently after the tenant PATCH. When replacing a domain, a failed add can coincide with a successful removal, leaving the tenant without its prior valid domain even though the mutation reports failure. Creation can similarly leave an orphan tenant if child-domain creation fails. Prefer an atomic backend operation; otherwise add and validate before deleting, provide compensation, and make retries idempotent.

EditTenantModal.tsx
line 13-16
The edit drawer discards the query error state. Once the request fails, `isLoading` becomes false but `initialValues` remains null, and TenantFormModal continues rendering `Loading tenant…` indefinitely with no explanation or retry path. Propagate `isError` and `refetch` into an explicit error state.

line 27-34
Blank database values and entitlement are converted to `undefined`. Axios JSON serialization omits those properties, so clearing an existing value in the form produces a PATCH that leaves the old server value unchanged while the UI reports success. Send the API's explicit clearing representation, such as `null` or an empty string, and type the payload accordingly.

tenantForm.ts
line 95-96
The UI distinguishes a primary domain, but this function collapses primary and additional domains into an unordered set. Promoting an existing additional domain produces the same set, so synchronization sends no request and the subsequent refetch retains the previous first domain. Persist an explicit primary marker/order through the API or remove the unsupported primary-domain behavior.
