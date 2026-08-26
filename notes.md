# PR Title

## Summary

## Why

## Technical Notes

## Testing/Validation

## Related Work

- Jira story: [CPR-849](https://abc-jira.atlassian.net/browse/CPR-849)

Plan: Typeahead de Manufacturer Contract
Sustituir la entrada libre por un selector remoto multi-selección, replicando Product Name: debounce, paginación, caché de seleccionados, estados de carga/error y reintento. La serialización final seguirá usando manufacturer_contract_name como CSV.

Steps

Crear useManufacturerContractNameFilterOptionsQuery basado en el hook de Product Name.

Consultará /chargebacks/missing/manufacturer-contract-name/ con manufacturer_contract_name, limit, offset y signal.
Validará el envelope recibido, interpretará next para paginar y devolverá opciones únicas donde id y label sean manufacturer_contract_name.
Incluirá tenantId, versión de filtros globales, búsqueda normalizada y página en la query key.
Crear ManufacturerContractNameFilter como componente hermano de MaterialNameFilter.tsx.

Misma UX: debounce de 300 ms, checkboxes, preservación de contratos seleccionados, “Load more”, estados idle/vacío/carga/error y reintento.
Textos adaptados a Manufacturer Contract.
Exportar el nuevo componente desde index.ts.

En ContractSalesWithoutGeneratedChargebacksPage.tsx, reemplazar el FilterTagSearch de Manufacturer Contract por el typeahead.

Pasar tenant?.tenant_uuid, draftFilters.manufacturerContracts y una función basada en toggleId.
Conservar contractSalesWithoutChargebacksFilters.ts intacto: continuará generando manufacturer_contract_name como CSV al pulsar “Show results”.
Añadir tests del hook:

Solicitud con manufacturer_contract_name=aj, limit y offset=0.
Parseo de AJ-ESCRIPT, AJPRXO, AJSELECT y NULL.
Paginación desde next, búsqueda vacía, cambios de filtros globales y envelope inválido.
Añadir tests del componente:

Debounce, seleccionar/deseleccionar, persistencia al cambiar búsqueda y remontar, estados y paginación/reintento.
Actualizar el test de página para mockear el nuevo hook y validar que contratos seleccionados se aplican como manufacturer_contract_name CSV tanto a la tabla como a la exportación.

Verificación

Ejecutar los tests focalizados de hook, componente, filtros y página.
Ejecutar npm run typecheck.
Comprobar manualmente que aj dispara el endpoint tras el debounce y que varios contratos seleccionados se envían separados por comas.
Decisiones

No generalizar MaterialNameFilter en este cambio: un componente hermano conserva el patrón existente con menor riesgo.
No se modifica /chargebacks/missing/ ni la exportación.
El filtro dejará de admitir contratos escritos o pegados manualmente; solo se seleccionarán resultados remotos.