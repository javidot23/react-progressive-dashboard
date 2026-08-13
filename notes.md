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
 
 
 
 
 