-- =====================================================================
-- Datos de prueba del CRM
--
-- Clientes con sus oportunidades (citas y eventos) repartidas en los últimos
-- cinco meses y el próximo, cobros en efectivo, tarjeta y bizum, ventas
-- (presupuestos, confirmadas y facturadas), facturas cobradas y pendientes,
-- y empleados con fichajes y vacaciones.
--
-- Todo lo que crea lleva un email de prueba.test; se borra entero con
-- `supabase/semillas/borrar_datos_prueba.sql`. Se pega en el editor SQL de
-- Supabase. Las facturas se emiten con `facturar_venta`, la misma función que
-- usa el CRM, en nombre del primer propietario.
-- =====================================================================

do $$
declare
  nombres text[] := array[
    'Alba Torres', 'Bruno Castillo', 'Carla Núñez', 'Daniel Herrera', 'Elena Vidal',
    'Fran Moreno', 'Gema Prieto', 'Hugo Lozano', 'Irene Campos', 'Jorge Medina',
    'Laura Rubio', 'Marcos Peña', 'Noa Iglesias', 'Pablo Cano', 'Rocío Delgado',
    'Sergio Vega', 'Teresa Fuentes', 'Víctor Molina'
  ];
  estilos text[] := array['Fine line', 'Blackwork', 'Realismo', 'Tradicional', 'Acuarela', 'Minimalista'];
  zonas text[] := array['Antebrazo', 'Brazo', 'Espalda', 'Tobillo', 'Costillas', 'Muñeca', 'Hombro', 'Pierna'];
  metodos text[] := array['efectivo', 'tarjeta', 'tarjeta', 'efectivo', 'bizum', 'tarjeta'];
  eventos text[] := array['boda', 'fiesta', 'empresa', 'festival'];
  disenos uuid[];
  propietario uuid;
  hoy date := (now() at time zone 'Europe/Madrid')::date;
  v_cliente uuid;
  v_cita uuid;
  v_venta uuid;
  v_factura uuid;
  v_empleado uuid;
  v_email text;
  v_fecha date;
  v_estado text;
  v_dia date;
  i int;
  k int;
begin
  perform setseed(0.42);
  select array_agg(id order by orden) into disenos from public.disenos where disponible;
  select id into propietario from public.perfiles where rol = 'propietario' order by created_at limit 1;

  -- --- Clientes y oportunidades --------------------------------------------------
  for i in 1 .. array_length(nombres, 1) loop
    v_email := lower(translate(nombres[i], 'áéíóúñÁÉÍÓÚÑ ', 'aeiounAEIOUN.')) || '@prueba.test';
    insert into public.clientes (nombre, email, telefono, notas, created_at)
    values (
      nombres[i], v_email, '6' || lpad((10000000 + i * 734251)::text, 8, '0'),
      case when i % 4 = 0 then 'Prefiere citas por la tarde.' end,
      now() - (60 + i * 7) * interval '1 day'
    )
    returning id into v_cliente;

    -- Entre una y tres oportunidades por cliente (el límite es tres por hora y email).
    for k in 1 .. 1 + (i % 3) loop
      v_fecha := hoy + (30 - floor(random() * 180))::int;
      v_estado := case
        when v_fecha > hoy then (array['solicitada', 'confirmada', 'confirmada'])[1 + floor(random() * 3)::int]
        when random() < 0.15 then 'cancelada'
        when random() < 0.12 then 'confirmada'
        else 'realizada'
      end;

      insert into public.citas (
        cliente_id, nombre, email, telefono, diseno_id, estilo_interes, zona_cuerpo,
        fecha_deseada, mensaje, estado, tipo, tipo_evento, lugar, asistentes, empresa,
        importe, created_at
      ) values (
        v_cliente, nombres[i], v_email, null,
        case when k = 1 and i % 2 = 0 then disenos[1 + (i % array_length(disenos, 1))] end,
        estilos[1 + ((i + k) % array_length(estilos, 1))],
        zonas[1 + ((i * k) % array_length(zonas, 1))],
        v_fecha,
        'Solicitud de prueba.',
        v_estado,
        case when i % 6 = 0 and k = 1 then 'evento' else 'cita' end,
        case when i % 6 = 0 and k = 1 then eventos[1 + (i % 4)] end,
        case when i % 6 = 0 and k = 1 then 'Madrid' end,
        case when i % 6 = 0 and k = 1 then 40 + i * 5 end,
        case when i % 6 = 0 and k = 1 and eventos[1 + (i % 4)] = 'empresa' then 'Empresa de prueba S.L.' end,
        (80 + floor(random() * 33) * 10)::numeric,
        least(now(), (v_fecha - (7 + floor(random() * 30))::int)::timestamp at time zone 'Europe/Madrid')
      )
      returning id into v_cita;

      -- El trigger de alta deja la cita sin cobrar: el cobro va aparte, como en el CRM.
      if v_estado = 'realizada' and random() < 0.85 then
        update public.citas
           set pagado = true, fecha_cobro = v_fecha, metodo_pago = metodos[1 + floor(random() * 6)::int]
         where id = v_cita;
      end if;
    end loop;
  end loop;

  -- Orden de las tarjetas en el tablero, detrás de las que ya había.
  update public.citas c
     set posicion = 10 + o.n
    from (
      select id, row_number() over (partition by estado order by fecha_deseada) as n
        from public.citas where email like '%@prueba.test'
    ) o
   where c.id = o.id;

  -- --- Propuestas de negocio ---------------------------------------------------------
  -- Sin ficha de cliente ni cobro: el email no coincide con ningún cliente.
  insert into public.citas (nombre, email, telefono, mensaje, estado, tipo, empresa, posicion, created_at)
  values
    ('Lorena Paredes', 'lorena@tintasdelsur.prueba.test', '611204588',
     'Distribuimos tintas veganas certificadas. ¿Os enviamos un muestrario?',
     'solicitada', 'proveedor', 'Tintas del Sur', 1, now() - interval '2 days'),
    ('Óliver Sanz', 'oliver@agujaspro.prueba.test', null,
     'Cartuchos de agujas con 15 % de descuento el primer pedido.',
     'confirmada', 'proveedor', 'Agujas Pro', 1, now() - interval '9 days'),
    ('Claudia Reyes', 'claudia@barberialuz.prueba.test', '622871034',
     'Somos una barbería del barrio y nos gustaría hacer un día de puertas abiertas juntos.',
     'solicitada', 'colaboracion', 'Barbería Luz', 2, now() - interval '1 day'),
    ('Diego Fajardo', 'diego@revistaink.prueba.test', null,
     'Preparamos un reportaje sobre estudios de Madrid y queremos incluiros.',
     'realizada', 'colaboracion', 'Revista Ink', 1, now() - interval '25 days'),
    ('Marina Leal', 'marina.leal@prueba.test', '633190245',
     'Fotógrafa: busco un estudio para una sesión editorial un domingo.',
     'confirmada', 'otro', null, 2, now() - interval '6 days'),
    ('Tomás Gallardo', 'tomas@mueblesgallardo.prueba.test', null,
     'Renovamos mobiliario de estudios: camillas y sillas ergonómicas.',
     'cancelada', 'proveedor', 'Muebles Gallardo', 1, now() - interval '40 days');

  -- --- Ventas y facturas ------------------------------------------------------------
  -- auth.uid() del propietario para que las funciones y la RLS lo reconozcan.
  perform set_config('request.jwt.claims', json_build_object('sub', propietario, 'role', 'authenticated')::text, true);

  for i in 1 .. 8 loop
    select id into v_cliente from public.clientes
     where email like '%@prueba.test' order by created_at desc offset i - 1 limit 1;

    insert into public.ventas (cliente_id, valida_hasta, notas)
    values (v_cliente, hoy + 30, 'Venta de prueba.')
    returning id into v_venta;

    insert into public.lineas_venta (venta_id, orden, descripcion, diseno_id, cantidad, precio_unitario, descuento, iva)
    values
      (v_venta, 1, 'Sesión de tatuaje', disenos[1 + (i % array_length(disenos, 1))], 1, 120 + i * 15, 0, 21),
      (v_venta, 2, 'Crema de cuidado', null, 1 + (i % 2), 12, case when i % 3 = 0 then 10 else 0 end, 21);

    -- 1-2 presupuesto, 3 confirmada, 4-8 facturadas.
    if i >= 3 then
      update public.ventas set estado = 'confirmada' where id = v_venta;
    end if;
    if i >= 4 then
      v_factura := public.facturar_venta(v_venta);
      -- 4-7 cobradas (efectivo, tarjeta, tarjeta, bizum); la 8 queda pendiente.
      if i <= 7 then
        update public.facturas
           set estado = 'cobrada', fecha_cobro = hoy,
               metodo_pago = (array['efectivo', 'tarjeta', 'tarjeta', 'bizum'])[i - 3]
         where id = v_factura;
      end if;
    end if;
  end loop;

  perform set_config('request.jwt.claims', '', true);

  -- --- Empleados, fichajes y vacaciones ---------------------------------------------
  for i in 1 .. 4 loop
    insert into public.empleados (nombre, email, telefono, puesto, departamento, fecha_alta, estado)
    values (
      (array['Andrea Solís', 'Rubén Ortiz', 'Nerea Castaño', 'Iker Bravo'])[i],
      (array['andrea.solis', 'ruben.ortiz', 'nerea.castano', 'iker.bravo'])[i] || '@prueba.test',
      '6' || lpad((20000000 + i * 911377)::text, 8, '0'),
      (array['Tatuador/a', 'Piercer', 'Recepcionista', 'Aprendiz'])[i],
      (array['Estudio', 'Estudio', 'Recepción', 'Estudio'])[i],
      hoy - (40 + i * 25),
      'activo'
    )
    returning id into v_empleado;

    -- Últimos diez días laborables, de 10:00 a 18:00 con algo de margen.
    for v_dia in select d::date from generate_series(hoy - 14, hoy - 1, interval '1 day') d
                 where extract(isodow from d) < 6 loop
      insert into public.fichajes (empleado_id, entrada, salida)
      values (
        v_empleado,
        (v_dia + time '10:00')::timestamp at time zone 'Europe/Madrid' + floor(random() * 20) * interval '1 minute',
        (v_dia + time '18:00')::timestamp at time zone 'Europe/Madrid' + floor(random() * 40) * interval '1 minute'
      );
    end loop;

    insert into public.vacaciones (empleado_id, desde, hasta, motivo, estado)
    values (
      v_empleado, hoy + 20 + i * 7, hoy + 24 + i * 7, 'Vacaciones de prueba',
      case when i % 2 = 0 then 'aprobada' else 'pendiente' end
    );
  end loop;

  -- --- Evaluaciones ----------------------------------------------------------------
  -- Una por trimestre ya cerrado en el que haya estado al menos 30 días: quien
  -- acaba de entrar todavía no tiene ninguna.
  insert into public.evaluaciones (empleado_id, trimestre, nota, comentario)
  select e.id,
         to_char(q, 'YYYY') || '-T' || extract(quarter from q),
         c.nota,
         c.comentario
    from public.empleados e
   cross join generate_series(
           date_trunc('quarter', e.fecha_alta::timestamp),
           date_trunc('quarter', hoy::timestamp) - interval '3 months',
           interval '3 months'
         ) q
   cross join lateral (
           select * from (values
             (1, 5::smallint, 'Trabajo impecable y clientes que repiten.'),
             (2, 4::smallint, 'Muy buen ritmo; puede delegar más en el equipo.'),
             (3, 4::smallint, 'Buena acogida en el estudio y aprende rápido.'),
             (4, 3::smallint, 'Cumple, pero debe cuidar la puntualidad al fichar.'),
             (5, 4::smallint, 'Atención al cliente muy cuidada.')
           ) v(n, nota, comentario)
          where v.n = 1 + abs(hashtext(e.email || q::text)) % 5
         ) c
   where e.email like '%@prueba.test'
     and e.estado <> 'baja'
     and e.fecha_alta <= (q + interval '3 months')::date - 31
  on conflict (empleado_id, trimestre) do nothing;
end;
$$;
