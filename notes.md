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
