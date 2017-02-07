/**
 * Clase especifica para la definicion de la ventana para la edicion y creacion de resultados de pruebas
 * para los atletas.
 *
 * Esta pantalla tiene ciertas particularidades tecnicas, ya que para obtener ciertos datos y que el workflow
 * de la pantalla funcione , se requeria que la carga del combo de pruebas fuera sincronico y ademas antes
 * de ir a la base de datos conociera los datos del filtro.
 *
 * Para resolver estos temas se ha hecho que el modelo de datos para las pruebas sea sincronico en otras
 * palabras que al ejecutar la llamada que requiere los datos de la prueba , el sistema no ejecute ninguna accion
 * hasta que esto termine, asi mismo en la ventana de la grilla principal se agrego los campos necesarios para el filtro
 * de tal forma que antes de efectuar la lectura ya conozaca esos datos.
 *
 * Esto obviamente es tambien producto que los modelos de las competencias y atletas son asincronicos y no se puede predecir
 * que a leer los datos de las pruebas , los datos de categoria y sexo ya esten cargados.
 *
 * El que el modelo de datos de las pruebas sea sincronico tambien era necesario para mostrar o no la grilla de detalle
 * del resultado , ya que se requeria saber si la prueba era multiple , para lo cual los datos de la prueba ya deberian estar
 * leidos.
 *
 * @version 1.00
 * @since 1.00
 * $Author: aranape $
 * $Date: 2014-07-29 23:56:07 -0500 (mar, 29 jul 2014) $
 * $Rev: 324 $
 */
isc.defineClass("WinCompetenciasResultadosMantForm", "WindowBasicFormExt");
isc.WinCompetenciasResultadosMantForm.addProperties({
    ID: "winCompetenciasResultadosMantForm",
    title: "Mantenimiento de Resultados de Pruebas x Competencia",
    autoSize: false,
    width: '780',
    height: '270',
    joinKeyFields: [{
        fieldName: 'competencias_pruebas_id',
        fieldValue: ''
    }],
    efficientDetailGrid: false,
    createForm: function (formMode) {
        return isc.DynamicFormExt.create({
            ID: "formCompetenciasPruebasResultadosMantForm",
            numCols: 8,
            fixedColWidths: false,
            padding: 2,
            dataSource: mdl_competencias_pruebas,
            observeDataSource: true,
            formMode: this.formMode,
            // parametro de inicializacion
            keyFields: ['pruebas_codigo'],
            saveButton: this.getFormButton('save'),
            focusInEditFld: 'competencias_pruebas_fecha',
            _postasController: undefined,
            // Para cache solamente datos de la competencia para validar o presentacion
            // unicamente.
            _vcache_competencias_fecha_inicio: undefined,
            _vcache_competencias_fecha_final: undefined,
            _vcache_competencias_descripcion_visual: undefined,
            _vcache_apppruebas_multiple: undefined,
            fields: [
                {
                    name: "competencias_codigo",
                    type: 'staticText',
                    showPending: true,
                    endRow: true,
                    colSpan: 8,
                    width: "*",
                    formatValue: function (value, record, form, item) {
                        return formCompetenciasPruebasResultadosMantForm._vcache_competencias_descripcion_visual;
                    }
                },
                {
                    ID: "fcr_cb_pruebas",
                    name: "pruebas_codigo",
                    editorType: "comboBoxExt",
                    showPending: true,
                    width: "250",
                    colSpan: 2,
                    valueField: "pruebas_codigo",
                    displayField: "pruebas_descripcion",
                    pickListFields: [
                        {
                            name: "pruebas_descripcion",
                            width: '60%'
                        },
                        {
                            name: "pruebas_sexo",
                            width: '10%'
                        },
                        {
                            name: "apppruebas_multiple",
                            width: '10%'
                        }],
                    pickListWidth: 360,
                    completeOnTab: true,
                    optionOperationId: 'fetchPruebasValidasForCompetencia',
                    // En este combo es vital ya que yo mismo hago el fetchData , ver explicacion en la clase
                    fetchMissingValues: false,
                    optionDataSource: mdl_competencias_pruebas_list,
                    autoFetchData: false,
                    textMatchStyle: 'substring',
                    sortField: "pruebas_descripcion",
                    /**
                     * Se hace el override ya que este campo requiere que solo obtenga las pruebas
                     * que dependen de la de la categoria y el sexo del atleta,el primero proviene
                     * de la competencia y el segundo del atleta.
                     */
                    getPickListFilterCriteria: function () {
                        var competenciaCodigo = formCompetenciasPruebasResultadosMantForm.getValue('competencias_codigo');
                        // Recogo primero el filtro si existe uno y luego le agrego
                        // la categoria y el sexo.
                        var filter = this.pickListCriteria;
                        if (filter == null) {
                            filter = {};
                        }

                        var filterSearchExact = (filter.filterSearchExact ? filter.filterSearchExact : false);
                        if (filterSearchExact === false) {
                            filter = this.Super("getPickListFilterCriteria", arguments);
                        }
                        if (filter == null) {
                            filter = {};
                        }

                        // 
                        // Si existe una  prueba en el filtro estamos en un edit por ende solo buscamos dicha prueba
                        // esto por eficiencia y no jalamaos todo innecesariamente.
                        if ((filter.pruebas_codigo && !filter.pruebas_descripcion) || filterSearchExact === true) {
                            filter = {
                                _constructor: "AdvancedCriteria",
                                operator: "and",
                                criteria: [{
                                    fieldName: "pruebas_codigo",
                                    operator: "equals",
                                    value: filter.pruebas_codigo
                                },
                                    {
                                        fieldName: "competencias_codigo",
                                        operator: "equals",
                                        value: competenciaCodigo
                                    }]
                            };
                        } else if (filter.pruebas_descripcion) {
                            filter = {
                                _constructor: "AdvancedCriteria",
                                operator: "and",
                                criteria: [{
                                    fieldName: "pruebas_descripcion",
                                    operator: "iContains",
                                    value: filter.pruebas_descripcion
                                },
                                    {
                                        fieldName: 'competencias_codigo',
                                        operator: 'equals',
                                        value: competenciaCodigo
                                    }]
                            };
                        } else {
                            filter = {
                                _constructor: "AdvancedCriteria",
                                operator: "and",
                                criteria: [{
                                    fieldName: 'competencias_codigo',
                                    operator: 'equals',
                                    value: competenciaCodigo
                                }]
                            };
                        }
                        return filter;
                    },
                    change: function (form, item, value, oldvalue) {
                        // Si el campo esta en blaco limipamos el estado de los campos
                        // asoicados y los ponemos en su default.
                        if (value == null || value == undefined) {
                            form._updateMarcasFieldsStatus(null, true, true);
                            form.setValue('competencias_pruebas_origen_id', null);
                            form.setValue('competencias_pruebas_origen_combinada', false);
                        }
                        return true;
                    },
                    changed: function (form, item, value) {
                        var record = item.getSelectedRecord();
                        // En el caso que se agregue una prueba que es parte de una combinada , tomaremos el origen de los resultados
                        // obtenidos en la lista , LOS CUALES DEBEN TRAER ESE VALOR DE SER EL CASO, sino sera null
                        if (record) {
                            form.setValue('competencias_pruebas_origen_id', record.competencias_pruebas_origen_id);
                            form.setValue('competencias_pruebas_origen_combinada', (record.competencias_pruebas_origen_id ? true : false));
                            // Actualizamos otros valores que dependen de la prueba seleccionad
                            form._updateMarcasFieldsStatus(record, true, true);
                            form._updateSeriesValues('FI');
                        }

                    }
                },
                {
                    name: 'fcr_btn_postas',
                    type: "button",
                    title: "Postas",
                    width: '*',
                    // Los botones vienen con estos 2 atributos definidos por
                    // eso hay que indicarlos
                    endRow: false,
                    startRow: false,
                    click: function () {
                        if (!formCompetenciasPruebasResultadosMantForm._postasController) {
                            formCompetenciasPruebasResultadosMantForm._postasController = isc.DefaultController.create({
                                mainWindowClass: undefined,
                                formWindowClass: 'WinPostasForm'
                            });
                        }
                        formCompetenciasPruebasResultadosMantForm._postasController.doSetup(true, {
                            competencias_pruebas_id: formCompetenciasPruebasResultadosMantForm.getItem('competencias_pruebas_id').getValue()
                        });

                    }
                },
                {
                    name: "competencias_pruebas_fecha",
                    useTextField: true,
                    showPickerIcon: false,
                    showPending: true,
                    width: 100,
                    endRow: true,
                    change: function (form, item, value, oldValue) {
                        // Verificamos que la fecha seleccionada este en el rango en que la competencia seleccionada
                        // se realizo.
                        if (value.getTime() > formCompetenciasPruebasResultadosMantForm._vcache_competencias_fecha_final.getTime() ||
                            value.getTime() < formCompetenciasPruebasResultadosMantForm._vcache_competencias_fecha_inicio.getTime()) {
                            isc.say('La fecha debe estar dentro de las fechas en que se realizo la competencia, <br>Del ' + formCompetenciasPruebasResultadosMantForm._vcache_competencias_fecha_inicio.toLocaleDateString() +
                                ' al ' + formCompetenciasPruebasResultadosMantForm._vcache_competencias_fecha_final.toLocaleDateString());
                            return false;
                        }
                        return true;
                    }
                },
                {
                    name: "competencias_pruebas_tipo_serie",
                    type: "select",
                    showPending: true,
                    defaultValue: "FI",
                    redrawOnChange: true,
                    changed: function (form, item, value) {
                        formCompetenciasPruebasResultadosMantForm._updateSeriesValues(value);
                    }
                },
                {
                    name: "competencias_pruebas_nro_serie",
                    showPending: true,
                    width: 50,
                    endRow: true,
                    textAlign: 'right',
                    validators: [{
                        type: "requiredIf",
                        expression: "formCompetenciasPruebasResultadosMantForm.getValue('competencias_pruebas_tipo_serie') != 'SU' && formCompetenciasPruebasResultadosMantForm.getValue('competencias_pruebas_tipo_serie') != 'FI'",
                        errorMessage: "Indique el nro de hit,serie,etc"
                    }]
                },
                {
                    name: 'cprf_sep_obs',
                    defaultValue: "Datos y Observaciones",
                    type: "section",
                    colSpan: 8,
                    width: "*",
                    canCollapse: false,
                    align: 'center',
                    itemIds: ["competencias_pruebas_manual",
                              "competencias_pruebas_viento",
                              "competencias_pruebas_anemometro",
                              "competencias_pruebas_material_reglamentario",
                              "competencias_pruebas_observaciones"]
                },
                {
                    name: "competencias_pruebas_manual",
                    defaultValue: false,
                    showPending: true,
                    labelAsTitle: true,
                    changed: function (form, item, value) {
                        // Si es cambiado de manual a electronico o viceversa , actualizamos los campos
                        // asociados al resultado ya que el formato del input depende de este valor.
                        formCompetenciasPruebasResultadosMantForm._updateMarcasFieldsStatus(formCompetenciasPruebasResultadosMantForm.getItem('pruebas_codigo').getSelectedRecord(), true, false);
                    }
                },
                {
                    name: "competencias_pruebas_viento",
                    showPending: true,
                    length: 12,
                    width: '50',
                    textAlign: 'right',
                    endRow: true
                },
                {
                    name: "competencias_pruebas_anemometro",
                    showPending: true,
                    width: '50',
                    defaultValue: true,
                    labelAsTitle: true,
                    changed: function (form, item, value) {
                        var pruebaRecord = formCompetenciasPruebasResultadosMantForm.getItem('pruebas_codigo').getSelectedRecord();
                        // Advertencia en el caso el viento de la prueba sea individual.
                        if (pruebaRecord && pruebaRecord.apppruebas_viento_individual === true) {
                            if (value === true) {
                                isc.say('Si ya existen resultados debe recordar colocarles el viento debido a la existencia del anemometro , grabe primero este cambio sino los resultados aun asumiran que no existe anemometro');
                            } else {
                                isc.say('Si ya existen resultados al grabar sin anemometro cada resultado tendra el viento en blanco en forma auutomatica');
                            }
                            // Actualizamos el control del campo viento
                            formCompetenciasPruebasResultadosMantForm._setupViento(value, pruebaRecord.apppruebas_viento_individual);
                        } else {
                            formCompetenciasPruebasResultadosMantForm._setupViento(value, false);
                        }
                    }
                },
                {
                    name: "competencias_pruebas_material_reglamentario",
                    showPending: true,
                    width: '50',
                    defaultValue: true,
                    labelAsTitle: true,
                    endRow: true
                },
                {
                    name: "competencias_pruebas_observaciones",
                    showPending: true,
                    colSpan: '8',
                    width: '*',
                    endRow: true
                },
                {
                    name: "competencias_pruebas_origen_combinada",
                    visible: false,
                    defaultValue: false
                },
                // Para join con detalles , no es visible
                {
                    name: "competencias_pruebas_id",
                    visible: false,
                    defaultValue: null
                },
                {
                    name: "competencias_pruebas_origen_id",
                    visible: false,
                    defaultValue: null
                }],
            setupFieldsToAdd: function (fieldsToAdd) {
                formCompetenciasPruebasResultadosMantForm._vcache_competencias_descripcion_visual = fieldsToAdd.competencias_descripcion_visual;
                // Para validar fecha de la prueba a crear.
                formCompetenciasPruebasResultadosMantForm._vcache_competencias_fecha_inicio = fieldsToAdd.competencias_fecha_inicio;
                formCompetenciasPruebasResultadosMantForm._vcache_competencias_fecha_final = fieldsToAdd.competencias_fecha_final;


                formCompetenciasPruebasResultadosMantForm.setValues({
                    'competencias_codigo': fieldsToAdd.competencias_codigo,
                    'competencias_pruebas_fecha': fieldsToAdd.competencias_fecha_inicio
                })
                formCompetenciasPruebasResultadosMantForm.setValue('competencias_codigo', fieldsToAdd.competencias_codigo);
                formCompetenciasPruebasResultadosMantForm.setValue('competencias_pruebas_fecha', fieldsToAdd.competencias_fecha_inicio);

            },
            prepareDataAfterSave: function (record) {
                var record_values;
                // Copiamos al registro los valores que son parte de este pero no de la forma.
                record_values = formCompetenciasPruebasResultadosMantForm.getItem('pruebas_codigo').getSelectedRecord();
                record.pruebas_descripcion = record_values.pruebas_descripcion;
                record.pruebas_generica_codigo = record_values.pruebas_generica_codigo;
                record.apppruebas_descripcion = record_values.apppruebas_descripcion;
                record.pruebas_sexo = record_values.pruebas_sexo;
                // Serie
                var tipo_serie = formCompetenciasPruebasResultadosMantForm.getValue('competencias_pruebas_tipo_serie');
                if (tipo_serie == 'SU' || tipo_serie == 'FI') {
                    record.serie = tipo_serie;
                } else {
                    record.serie = tipo_serie + "-" + formCompetenciasPruebasResultadosMantForm.getValue('competencias_pruebas_nro_serie');
                }
            },
            isPostOperationDataRefreshMainListRequired: function (operationType) {
                if (formCompetenciasPruebasResultadosMantForm._vcache_apppruebas_multiple && operationType == 'add') {
                    return true;
                }
                return false;
            },
            /**
             * Override para aprovecha que solo en modo add se blanqueen todas las variables de cache y el estado
             * de los campos a su modo inicial o default.
             *
             * @param {string} mode 'add' o 'edit'
             */
            setEditMode: function (mode) {
                this.Super("setEditMode", arguments);
                if (mode == 'add') {

                    formCompetenciasPruebasResultadosMantForm._updateMarcasFieldsStatus(null, null, null);
                    formCompetenciasPruebasResultadosMantForm._updateSeriesValues('FI');
                    formCompetenciasPruebasResultadosMantForm._setupPostasBtn(null);

                } else {
                    formCompetenciasPruebasResultadosMantForm._updateSeriesValues(formCompetenciasPruebasResultadosMantForm.getItem('competencias_pruebas_tipo_serie').getValue());
                    formCompetenciasPruebasResultadosMantForm._setupPostasBtn(formCompetenciasPruebasResultadosMantForm.getItem('pruebas_codigo').getSelectedRecord());
                    //   formCompetenciasPruebasResultadosMantForm._setupViento(formCompetenciasPruebasResultadosMantForm.getValue('competencias_pruebas_anemometro'));

                }
            },
            preSetFieldsToEdit: function (fields) {

                formCompetenciasPruebasResultadosMantForm._vcache_competencias_descripcion_visual = fields.competencias_descripcion_visual;
                // Para validar fecha de la prueba a crear.
                formCompetenciasPruebasResultadosMantForm._vcache_competencias_fecha_inicio = fields.competencias_fecha_inicio;
                formCompetenciasPruebasResultadosMantForm._vcache_competencias_fecha_final = fields.competencias_fecha_final;
            },
            /**
             * IMPORTANTE: Este override es viatal en este caso ya que es el unico punto
             * donde se puede interceptar previo a que los datos de pantalla sean leidos
             * ya que el controlador al abrir esta forma al EDITAR un campo recoge de la grilla
             * el registro a editar usando este metodo.
             *
             * Esto se requiere para :
             * 1) preparar los datos para el filtro de las pruebas antes que la pantalla se actualize y garantizar
             * que la criteria para el combo de pruebas pueda filtrar correctamente.
             * Asi mismo esto nos permite actualizar los campos qe dependen de la prueba.
             *
             * 2) Forzamos un fetch ya que dado la propiedad  fetchMissingValues esta en false,ya no habra ectura automatica
             * y asi mismo ponemos como filttro la prueba ya conocida desde el record editable y esto forzara solo
             * la lectura de ese codigo de prueba.
             *
             * 3) Actualizamos el estado de los campos de las marcas acorde al tipo de prueba actual en
             * edicion.
             *
             * @param {ListGrid} component la grilla origen o fuente del registro a editar.
             */
            editSelectedData: function (component) {

                this.Super('editSelectedData', arguments);

                var record = component.getSelectedRecord();

                // Aqui forzamos solo a leer un registro justo el que corresponde a la prueba
                // de este registro.
                // 
                winCompetenciasResultadosMantForm.fetchFieldRecord('pruebas_codigo', {
                    "pruebas_codigo": record.pruebas_codigo,
                    "pruebas_descripcion": undefined
                });
            },
            fieldDataFetched: function (formFieldName, record) {
                if (formFieldName === 'pruebas_codigo') {
                    formCompetenciasPruebasResultadosMantForm._updateMarcasFieldsStatus(record, false, false);
                    formCompetenciasPruebasResultadosMantForm._setupPostasBtn(record);
                }
            },
            canShowTheDetailGrid: function (mode) {
                if (mode == 'add') {
                    if (formCompetenciasPruebasResultadosMantForm._vcache_apppruebas_multiple == true) {
                        return false;
                    }
                }
                return true;
            },
            /*******************************************************************
             *
             * FUNCIONES DE SOPORTE PARA LA FORMA
             */
            _setupPostasBtn: function (record) {
                if (record) {
                    if (record.apppruebas_nro_atletas > 1) {
                        formCompetenciasPruebasResultadosMantForm.getItem('fcr_btn_postas').enable();
                    } else {
                        formCompetenciasPruebasResultadosMantForm.getItem('fcr_btn_postas').disable();
                    }
                } else {
                    formCompetenciasPruebasResultadosMantForm.getItem('fcr_btn_postas').disable();
                }
            },
            _setupViento: function (withAnemometro, isVientoIndividual) {
                var itViento = formCompetenciasPruebasResultadosMantForm.getItem('competencias_pruebas_viento');
                if (withAnemometro === true && isVientoIndividual === false) {
                    itViento.enable();
                    itViento.show();
                } else {
                    itViento.clearValue();
                    itViento.hide();
                }
            },
            _updateSeriesValues: function (tipoSerieValue) {
                var itTipoSerie = formCompetenciasPruebasResultadosMantForm.getItem('competencias_pruebas_tipo_serie');
                var itNroSerie = formCompetenciasPruebasResultadosMantForm.getItem('competencias_pruebas_nro_serie');
                if (tipoSerieValue == 'SU' || tipoSerieValue == 'FI') {
                    itNroSerie.setValue(1);
                    itNroSerie.hide();
                } else {
                    itNroSerie.setRequired(true);
                    itNroSerie.show();
                }
                // Si es multiple ademas no se puede cambiar el tipo de serie por no haber.
                if (formCompetenciasPruebasResultadosMantForm._vcache_apppruebas_multiple == true) {
                    itTipoSerie.setValue('FI');
                    itTipoSerie.hide();
                    itNroSerie.setValue(1);
                    itNroSerie.hide();
                } else {
                    itTipoSerie.show();
                }
            },
            _updateMarcasFieldsStatus: function (record, clearResultado, pruebaChanged) {
                if (record) {
                    formCompetenciasPruebasResultadosMantForm._vcache_apppruebas_multiple = record.apppruebas_multiple;
                    formCompetenciasPruebasResultadosMantForm.__updateMarcasFieldsStatus(pruebaChanged, clearResultado, record.unidad_medida_tipo, record.unidad_medida_regex_e, record.unidad_medida_regex_m, record.apppruebas_verifica_viento, record.apppruebas_viento_individual);
                } else {
                    formCompetenciasPruebasResultadosMantForm._vcache_apppruebas_multiple = undefined;
                    formCompetenciasPruebasResultadosMantForm.__updateMarcasFieldsStatus(true, true, undefined, undefined, undefined, undefined, undefined);
                }
            },
            /**
             * @param {object} record ,, con el registro de la clasificacion de prueba seleccionado en el
             * campo pruebas_clasificacion_codigo.
             * @param {boolean} clearFields , true si los campos de marca menor y mayor deben ser limpiados y activados
             */
            __updateMarcasFieldsStatus: function (pruebaChanged, clearResultado, unidad_medida_tipo, unidad_medida_regex_e, unidad_medida_regex_m, apppruebas_verifica_viento, apppruebas_viento_individual) {
                var thisForm = formCompetenciasPruebasResultadosMantForm; // para velocidad
                var itemEsManual = thisForm.getItem('competencias_pruebas_manual');
                var itViento = thisForm.getItem('competencias_pruebas_viento');
                var itAnemometro = thisForm.getItem('competencias_pruebas_anemometro');
                var itMaterial = thisForm.getItem('competencias_pruebas_material_reglamentario');
                // Si la unidad de medida es tiempo , si la prueba es cambiada se activa y se muestra el checkbox
                // de manual  , de lo contrario de limpia el campo y se esconde.
                if (unidad_medida_tipo == 'T') {
                    if (pruebaChanged) {
                        thisForm._setFieldStatus(itemEsManual, true, false, true);
                        thisForm._setFieldStatus(itViento, false, true, true);
                    } else {
                        thisForm._setFieldStatus(itemEsManual, true, false, false);
                    }
                } else {
                    thisForm._setFieldStatus(itemEsManual, false, true, true);
                }
                // Si la prueba requeire verificacion de viento , se enciende el
                // campo de viento y si la unidad de medida es tiempo o Metros (para los saltos largo/triple)
                // se indica requerido.
                // IMPORTANTE:
                // Por ahora no se soporta anemometro en forma individual , en realidad si  apppruebas_viento_individual es true
                // deberiamos permitir que el anemometro sea individual tambien , por ahora sera general a todos
                // los participantes , esto debe ser mejorado.
                if (apppruebas_verifica_viento == true && (unidad_medida_tipo == 'T' || unidad_medida_tipo == 'M')) {
                    // Si la prueba verifica viento , veamos si esta encendido el anemometro
                    thisForm._setFieldStatus(itAnemometro, true, false, false);
                    // Si el viento es individual el viento debe ir en cada resultado individual.
                    thisForm._setupViento(itAnemometro.getValue(), apppruebas_viento_individual);
                }
                else {
                    // Si no se requiere se apaga y se indica no requerido.
                    thisForm._setFieldStatus(itAnemometro, false, true, true);
                    thisForm._setupViento(false, false);
                }

                // Para el caso de pruebas multiples no se requiere mostrar o editar los resultados de la
                // prueba , ya que seran un summary de la grilla de detalle.
                if (thisForm._vcache_apppruebas_multiple) {
                    thisForm._setFieldStatus(itMaterial, false, true, false);
                } else {
                    thisForm._setFieldStatus(itMaterial, true, false, false);
                }
            },
            /**
             * Funcion de soporte para limpiar un campo , sus errores y activarlo o desactivarlo.
             *
             * Importante , si un campo viene de la base de datos en null o undefined , clearField
             * lo removera de los valores a crear en el nuevo record a editar.
             *
             * @param {FormItem} campo de la forma
             * @param {boolean} enable true para activar , false para desactivar.
             * @param {boolean} hide true para esconder , false para mostrar.
             * @param {boolean} clear true para limpiar campo, false no tocarlo.
             */
            _setFieldStatus: function (field, enable, hide, clear) {
                if (clear == true) {
                    field.clearErrors();
                    field.clearValue();
                }
                if (hide == true) {
                    field.hide();
                } else {
                    field.show();
                }
                if (enable == false) {
                    field.disable();
                } else {
                    field.enable();
                }
            }
            // , cellBorder: 1
        });
    },
    createDetailGridContainer: function (mode) {
        return isc.DetailGridContainer.create({
            ID: "cpr_detailGridContainer",
            height: 280,
            sectionTitle: 'Resultados',
            gridProperties: {
                ID: 'g_atletas_resultados',
                fetchOperation: 'fetchJoined',
                // solicitado un resultset con el join a atletas resuelto por eficiencia
                dataSource: 'mdl_atletas_resultados',
                sortField: "atletas_resultados_puesto",
                autoFetchData: false,
                canSort: false,
                canEdit: false,
                canAdd: true,
                fields: [
                    {
                        name: "atletas_nombre_completo",
                        width: '50%'
                    },
                    {
                        name: "postas_atletas",
                        width: '50%'
                    },
                    {
                        name: "atletas_resultados_resultado"
                    },
                    {
                        name: "atletas_resultados_viento"
                    },
                    {
                        name: "atletas_resultados_puntos"
                    },
                    {
                        name: "atletas_resultados_puesto"
                    }],
                mainFormItemChanged: function (item, newValue) {
                    if (item.name === 'pruebas_codigo') {
                        var record = item.getSelectedRecord();
                        if (record) {
                            g_atletas_resultados._setupGridFields(record);
                        }
                    }
                    return true;
                },
                onRemoveRecordClick: function (rowNum) {
                    if (formCompetenciasPruebasResultadosMantForm.getValue('competencias_pruebas_origen_combinada') == true) {
                        isc.say('No puede eliminarse individualmente resultados que conforman una prueba combinada , eliminelo desde la misma prueba principal.');
                        return false;
                    }
                    return true;
                },
                fieldDataFetched: function (formFieldName, record) {
                    if (formFieldName === 'pruebas_codigo') {
                        g_atletas_resultados._setupGridFields(record);
                    }
                },
                _setupGridFields: function (pruebasRecord) {
                    if (pruebasRecord && pruebasRecord.competencias_pruebas_origen_id) {
                        g_atletas_resultados.showField('atletas_resultados_puntos');
                    } else {
                        g_atletas_resultados.hideField('atletas_resultados_puntos');
                    }
                    if (pruebasRecord && pruebasRecord.apppruebas_viento_individual == true) {
                        g_atletas_resultados.showField('atletas_resultados_viento');
                    } else {
                        g_atletas_resultados.hideField('atletas_resultados_viento');
                    }
                    if (pruebasRecord && pruebasRecord.apppruebas_nro_atletas > 1) {
                        g_atletas_resultados.showField('postas_atletas');
                        g_atletas_resultados.hideField('atletas_nombre_completo');
                    } else {
                        g_atletas_resultados.hideField('postas_atletas');
                        g_atletas_resultados.showField('atletas_nombre_completo');
                    }
                }
            },
            getFormComponent: function () {
                var newGrid;

                if (this.getChildForm() == undefined) {
                    newGrid = isc.DynamicFormExt.create({
                        numCols: 4,
                        colWidths: ["200",
                                    "100",
                                    "*",
                                    "*"],
                        fixedColWidths: false,
                        padding: 5,
                        dataSource: mdl_atletas_resultados,
                        formMode: this.formMode, // parametro de inicializacion
                        focusInEditFld: 'atletas_codigo',
                        fields: [
                            {
                                name: "atletas_codigo",
                                editorType: "comboBoxExt",
                                showPending: true,
                                valueField: "atletas_codigo",
                                displayField: "atletas_nombre_completo",
                                pickListWidth: 360,
                                endRow: true,
                                pickListFields: [
                                    {
                                        name: "atletas_codigo",
                                        width: '20%'
                                    },
                                    {
                                        name: "atletas_nombre_completo",
                                        width: '80%'
                                    }],
                                completeOnTab: true,
                                colSpan: 4,
                                width: 250,
                                optionOperationId: 'fetchForList',
                                editorProperties: {
                                    // Aqui es la mejor posicion del optionDataSource en cualquiera de los otros lados
                                    // en pickListProperties o afuera funciona de distinta manera.
                                    optionDataSource: mdl_atletas_list,
                                    minimumSearchLength: 3,
                                    autoFetchData: false,
                                    textMatchStyle: 'substring',
                                    sortField: "atletas_nombre_completo",
                                    getPickListFilterCriteria: function () {
                                        // Recogo primero el filtro si existe uno y luego le agrego
                                        //  el sexo del atleta.
                                        var record_prueba = formCompetenciasPruebasResultadosMantForm.getItem('pruebas_codigo').getSelectedRecord();
                                        var filter = this.Super("getPickListFilterCriteria", arguments);
                                        if (filter == null) {
                                            filter = {};
                                        }
                                        // Si existe un filtro ya pre digitado lo pongo en la criteria , de lo contrario
                                        // todos los del sexo indicado.
                                        if (filter.atletas_nombre_completo) {
                                            filter = {
                                                _constructor: "AdvancedCriteria",
                                                operator: "and",
                                                criteria: [{
                                                    fieldName: "atletas_nombre_completo",
                                                    operator: "iContains",
                                                    value: filter.atletas_nombre_completo
                                                },
                                                    {
                                                        fieldName: 'atletas_sexo',
                                                        operator: 'equals',
                                                        value: record_prueba.pruebas_sexo
                                                    }]
                                            };
                                        } else {
                                            filter = {
                                                _constructor: "AdvancedCriteria",
                                                operator: "and",
                                                criteria: [{
                                                    fieldName: 'atletas_sexo',
                                                    operator: 'equals',
                                                    value: record_prueba.pruebas_sexo
                                                }]
                                            };
                                        }
                                        return filter;
                                    }
                                }
                            },
                            {
                                name: "postas_id",
                                editorType: "comboBoxExt",
                                showPending: true,
                                required: false,
                                length: 50,
                                width: 180,
                                valueField: "postas_id",
                                displayField: "postas_descripcion",
                                redrawOnChange: true,
                                pickListFields: [
                                    {
                                        name: "postas_id",
                                        width: '10%'
                                    },
                                    {
                                        name: "postas_descripcion",
                                        width: '25%'
                                    },
                                    {
                                        name: "postas_atletas",
                                        width: '65%'
                                    }],
                                pickListWidth: 350,
                                optionOperationId: 'fetchJoinedWithNames',
                                optionDataSource: mdl_postas,
                                textMatchStyle: 'substring',
                                initialSort: [{property: 'postas_descripcion'}],
                                getPickListFilterCriteria: function () {
                                    // Recogo primero el filtro si existe uno y luego le agrego
                                    // id de la posta
                                    var filter = this.Super("getPickListFilterCriteria", arguments);
                                    if (filter == null) {
                                        filter = {};
                                    }

                                    if (filter.postas_descripcion) {
                                        filter = {
                                            _constructor: "AdvancedCriteria",
                                            operator: "and",
                                            criteria: [
                                                {
                                                    fieldName: "postas_atletas",
                                                    operator: "iContains",
                                                    value: filter.postas_atletas
                                                },
                                                {
                                                    fieldName: 'competencias_pruebas_id',
                                                    operator: 'equals',
                                                    value: formCompetenciasPruebasResultadosMantForm.getItem('competencias_pruebas_id').getValue()
                                                }]
                                        };
                                    } else {
                                        filter = {
                                            _constructor: "AdvancedCriteria",
                                            operator: "and",
                                            criteria: [{
                                                fieldName: 'competencias_pruebas_id',
                                                operator: 'equals',
                                                value: formCompetenciasPruebasResultadosMantForm.getItem('competencias_pruebas_id').getValue()
                                            }]
                                        };
                                    }
                                    return filter;
                                },
                                changed: function (form, item, newValue) {
                                    var record = item.getSelectedRecord();
                                    if (record) {
                                        form.getItem('postas_atletas').setValue(record.postas_atletas);
                                    } else {
                                        form.getItem('postas_atletas').setValue(undefined);
                                    }
                                }
                            },
                            {
                                name: "postas_atletas",
                                type: 'staticText',
                                startRow: true,
                                endRow: true
                            },
                            {
                                name: "atletas_resultados_resultado",
                                showPending: true,
                                validators: [{
                                    type: "regexp",
                                    showPending: true,
                                    expression: '^$'
                                }],
                                width: 85
                            },
                            {
                                name: "atletas_resultados_viento",
                                showPending: true,
                                width: 80,
                                endRow: true
                            },
                            {
                                name: "atletas_resultados_puntos",
                                showPending: true,
                                width: 60,
                                endRow: true
                            },
                            {
                                name: "atletas_resultados_puesto",
                                showPending: true,
                                width: 45
                            },
                            {
                                name: "competencias_pruebas_id",
                                visible: false,
                                defaultValue: null
                            }],
                        fieldDataFetched: function (formFieldName, record) {
                            if (formFieldName === 'pruebas_codigo') {
                                this._setupFields(record);
                            }
                        },
                        mainFormItemChanged: function (item, newValue) {
                            if (item.name === 'pruebas_codigo') {
                                var record = item.getSelectedRecord();
                                if (record) {
                                    this._setupFields(record);
                                }
                            }
                            return true;
                        },
                        postSaveData: function (mode, record) {
                            if (mode === 'edit') {
                                //var record= this.getField('atletas_codigo').getSelectedRecord();
                                g_atletas_resultados.getSelectedRecord().atletas_nombre_completo = this.getField('atletas_codigo').getDisplayValue();
                                var postasRecord = this.getField('postas_id').getSelectedRecord();
                                if (postasRecord) {
                                    g_atletas_resultados.getSelectedRecord().postas_atletas = this.getField('postas_id').getSelectedRecord().postas_atletas;
                                } else {
                                    g_atletas_resultados.getSelectedRecord().postas_atletas = null;
                                }

                            } else {
                                if (!record.hasOwnProperty('atletas_nombre_completo')) {
                                    isc.addProperties(record, {'atletas_nombre_completo': this.getField('atletas_codigo').getDisplayValue()});
                                } else {
                                    record.atletas_nombre_completo = this.getField('atletas_codigo').getDisplayValue();
                                }

                                if (!record.hasOwnProperty('postas_atletas')) {
                                    isc.addProperties(record, {'postas_atletas': this.getField('postas_id').getSelectedRecord().postas_atletas});
                                } else {
                                    record.postas_atletas = this.getField('postas_id').getSelectedRecord().postas_atletas;
                                }
                            }
                        },
                        setEditMode: function (mode) {
                            this.Super('setEditMode', arguments);
                            if (mode === 'add') {
                                var record = formCompetenciasPruebasResultadosMantForm.getItem('pruebas_codigo').getSelectedRecord();
                                if (record.apppruebas_nro_atletas > 1) {
                                    this.setValue('atletas_codigo', (record.pruebas_sexo === 'F' ? 'POSTAF' : 'POSTAM'));
                                } else {
                                    this.setValue('atletas_codigo', undefined);
                                }
                            }

                        },
                        _setupFields: function (pruebasRecord) {
                            // De acuerdo a si es manual o no se cambia la expresion regular para el input,
                            // validator.
                            var itResultado = this.getField('atletas_resultados_resultado');
                            if (formCompetenciasPruebasResultadosMantForm.getValue('competencias_pruebas_manual') != true) {
                                itResultado.validators[0].expression = pruebasRecord.unidad_medida_regex_e;
                            }
                            else {
                                itResultado.validators[0].expression = pruebasRecord.unidad_medida_regex_m;
                            }

                            if (pruebasRecord && pruebasRecord.competencias_pruebas_origen_id) {
                                this.showField('atletas_resultados_puntos');
                            }
                            else {
                                this.hideField('atletas_resultados_puntos');
                            }


                            if (pruebasRecord && pruebasRecord.apppruebas_viento_individual == true &&
                                formCompetenciasPruebasResultadosMantForm.getValue('competencias_pruebas_anemometro') === true) {
                                this.showField('atletas_resultados_viento');
                            }
                            else {
                                this.hideField('atletas_resultados_viento');
                            }

                            if (pruebasRecord && pruebasRecord.apppruebas_nro_atletas > 1) {
                                this.showField('postas_id');
                                this.showField('postas_atletas');
                                this.hideField('atletas_codigo');
                            } else {
                                this.hideField('postas_id');
                                this.hideField('postas_atletas');
                                this.showField('atletas_codigo');
                            }

                            var field = this.getField('atletas_resultados_resultado');

                            if (pruebasRecord && pruebasRecord.apppruebas_multiple === true) {
                                field.setCanEdit(false);
                                field.setRequired(false);
                            } else {
                                field.setCanEdit(true);
                                field.setRequired(true);
                            }
                        }
                    });
                } else {
                    newGrid = cpr_detailGridContainer.getChildForm();
                }
                return newGrid;
            }
        });
    },

    canShowTheDetailGrid: function (mode) {
        if (mode == 'add') {
            if (formCompetenciasPruebasResultadosMantForm._vcache_apppruebas_multiple !== false) {
                return false;
            }
        }
        return true;
    },
    initWidget: function () {
        this.Super("initWidget", arguments);
    }
});