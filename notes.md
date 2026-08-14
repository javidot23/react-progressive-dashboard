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

The multiple product name filter should be done differently. You have the endpoint `/material/` and when user writes the material name (search input filter), you should list materials that match that name, and on selected ones (checkbox list), you should send material numbers as a list.

The material number as list is supported through global filter on all endpoints.
For material you can send: `?material=2023232,23123123,1233332`.
Keep in mind there are two concepts there, material id and material number.

The material id is an auto incremental integer that we use on postgres for efficient indexing while `mat_nbr` or material number is the actual identifier. The Data Engineering team, or actual users, they don't know what material id is, it doesn't mean anything for them, only material number does.
We support both as filters through our APIs. If you send `?material=2023232,23123123,1233332` this will filter on `mat_nbr` or Material Number. If you send: `?material_id=100,101,103` this will filter on Material ID

Now there is ndc support across all apis that its POSSIBLE to support it.
The endpoints updated now support `?ndc=123123123,123123123`

For `po_number` or line filter the endpoint now supports `?po_number_or_line_number=123123,4124124124`.
Added as a customer filter for both.