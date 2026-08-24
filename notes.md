# PR Title

## Summary

## Why

## Technical Notes

## Testing/Validation

## Related Work

- Jira story: [CPR-849](https://abc-jira.atlassian.net/browse/CPR-849)

%sql
WITH tenant_products AS (
  SELECT DISTINCT mm.mat_nbr
  FROM cpr_test_scv.stratium_${tenant}.g_material_master mm
  ${primary_filter}
), 
sales AS (
  SELECT
    COALESCE(SUM(bt.sales_contr_amt), 0) AS total_sales_amount
  FROM cpr_test_scv.stratium_${tenant}.g_billing_transaction bt
  INNER JOIN tenant_products tp ON tp.mat_nbr = bt.mat_nbr
  WHERE bt.ord_created_date >= DATE_TRUNC('month', CURRENT_DATE())
    AND bt.ord_created_date <= CURRENT_DATE()
),
weekly_sales AS (
  SELECT
    COALESCE(SUM(bt.sales_contr_amt), 0) AS contract_sales_amount
  FROM cpr_test_scv.stratium_${tenant}.g_billing_transaction bt
  INNER JOIN tenant_products tp ON tp.mat_nbr = bt.mat_nbr
  WHERE bt.ord_created_date >= DATE_TRUNC('week', CURRENT_DATE())
    AND bt.ord_created_date <= CURRENT_DATE()
),
chargeback_invoices AS (
  SELECT DISTINCT invc_nbr
  FROM cpr_test_scv.stratium_${tenant}.g_dco_data
),
sales_no_cb AS (
  SELECT
    CAST(SUM(CASE WHEN ci.invc_nbr IS NULL THEN bt.sales_contr_amt ELSE 0 END) AS BIGINT) AS sales_without_chargeback_amount
  FROM cpr_test_scv.stratium_${tenant}.g_billing_transaction bt
  INNER JOIN tenant_products tp ON tp.mat_nbr = bt.mat_nbr
  LEFT JOIN chargeback_invoices ci ON bt.invc_nbr = ci.invc_nbr
  WHERE bt.ord_created_date >= DATE_TRUNC('month', CURRENT_DATE())
    AND bt.ord_created_date <= CURRENT_DATE()
),
cb AS (
  SELECT
    COALESCE(SUM(c.abc_req_amt), 0) AS chargeback_amount
  FROM cpr_test_scv.stratium_${tenant}.g_dco_data c
  INNER JOIN tenant_products tp ON tp.mat_nbr = c.mat_nbr
  WHERE c.chbk_hdr_created_date >= DATE_TRUNC('month', CURRENT_DATE())
    AND c.chbk_hdr_created_date <= CURRENT_DATE()
)
SELECT
  s.total_sales_amount,
  sn.sales_without_chargeback_amount,
  ws.contract_sales_amount,
  cb.chargeback_amount
FROM sales s
CROSS JOIN weekly_sales ws
CROSS JOIN sales_no_cb sn
CROSS JOIN cb;