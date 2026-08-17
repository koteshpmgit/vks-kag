// "Data Sheet" - the master input sheet (Application-Data | Project-Data | Resource-Data | Standards-Data)
(function () {

  // ---- small helpers to build editable grids ----
  function inputCell(value, onChange, type = 'text') {
    const inp = document.createElement(type === 'multi' ? 'textarea' : 'input');
    if (type !== 'multi') inp.type = type;
    if (type === 'multi') inp.rows = Math.min(6, Math.max(1, String(value || '').split('\n').length));
    inp.value = value ?? '';
    inp.onchange = () => onChange(inp.value);
    const td = document.createElement('td');
    td.appendChild(inp);
    return td;
  }

  function textCell(value, cls) {
    const td = document.createElement('td');
    td.textContent = value ?? '';
    if (cls) td.className = cls;
    return td;
  }

  function headRow(cols) {
    const tr = document.createElement('tr');
    cols.forEach((c) => {
      const th = document.createElement('th');
      th.textContent = c;
      tr.appendChild(th);
    });
    return tr;
  }

  function sectionTitle(host, id, text) {
    const div = document.createElement('div');
    div.className = 'section-title';
    div.id = id;
    div.textContent = text;
    host.appendChild(div);
    return div;
  }

  function subTitle(host, text) {
    const div = document.createElement('div');
    div.className = 'section-sub';
    div.textContent = text;
    host.appendChild(div);
  }

  // key/value editable table for object fields
  function kvTable(host, obj, fields, saver, app) {
    const tbl = document.createElement('table');
    tbl.className = 'grid';
    fields.forEach(([key, label, type]) => {
      const tr = document.createElement('tr');
      const th = document.createElement('th');
      th.style.width = '220px';
      th.textContent = label;
      tr.appendChild(th);
      const td = inputCell(obj[key] ?? '', (v) => {
        obj[key] = v;
        app.markDirty(saver);
      }, type || 'text');
      td.style.minWidth = '420px';
      tr.appendChild(td);
      tbl.appendChild(tr);
    });
    host.appendChild(tbl);
  }

  // editable collection grid with add/delete rows
  function collGrid(host, app, coll, rows, cols, extra = {}) {
    const tbl = document.createElement('table');
    tbl.className = 'grid';
    tbl.appendChild(headRow(['', ...cols.map((c) => c.label)]));
    rows.forEach((row) => {
      const tr = document.createElement('tr');
      const del = document.createElement('td');
      del.className = 'rowhead';
      const btn = document.createElement('button');
      btn.className = 'del-btn'; btn.textContent = '×'; btn.title = 'Delete row';
      btn.onclick = async () => {
        await API.del(`/projects/${app.projectId}/${coll}/${row.id}`);
        app.reloadAll();
      };
      del.appendChild(btn);
      tr.appendChild(del);
      cols.forEach((c) => {
        if (c.readonly) {
          tr.appendChild(textCell(c.fmt ? c.fmt(row[c.key], row) : row[c.key], 'calc'));
        } else {
          const val = c.type === 'date' ? isoDate(row[c.key]) : row[c.key];
          tr.appendChild(inputCell(val, (v) => {
            row[c.key] = v;
            app.markDirty(() => API.put(`/projects/${app.projectId}/${coll}/${row.id}`, row));
          }, c.type === 'multi' ? 'multi' : (c.type || 'text')));
        }
      });
      tbl.appendChild(tr);
    });
    host.appendChild(tbl);
    const add = document.createElement('button');
    add.className = 'addrow-btn';
    add.textContent = '+ Add row';
    add.onclick = async () => {
      const body = { sno: rows.length + 1, ...(extra.defaults || {}) };
      await API.post(`/projects/${app.projectId}/${coll}`, body);
      app.reloadAll();
    };
    host.appendChild(add);
  }

  const sheet = {
    id: 'datasheet',
    name: 'Data Sheet',
    render(host, data, app) {
      host.innerHTML = '';
      const { application, project, computed, resources, hrplan, phases, milestones,
        hardware, software, lists, docs, goals, training, process, environments, dar,
        modules, stdRoles, stdTools, matrix, folders } = data;

      const saveApp = () => API.put(`/application/${application.id}`, application);
      const saveProj = () => API.put(`/projects/${app.projectId}`, project);

      // ================= Application-Data =================
      sectionTitle(host, 'sec-app-details', 'Application-Data — Application Details');
      kvTable(host, application, [
        ['app_name', 'Application Name'],
        ['irn_no', 'IRN No'],
        ['app_size_fp', 'Application Size in FP'],
        ['front_office', 'Front Office'],
        ['domain', 'Domain'],
        ['category', 'Category'],
        ['description', 'Application Description', 'multi'],
        ['acceptance_criteria', 'Acceptance Criteria', 'multi'],
        ['life_cycle', 'Life Cycle', 'multi'],
        ['dcv', 'DCV'],
        ['cvs', 'CVS'],
        ['technology', 'Technology'],
        ['scope', 'Scope', 'multi'],
        ['org_chart_link', 'Org. Chart'],
        ['quality_plan_link', 'Quality Plan'],
        ['corfou_link', 'CORFOU Link'],
        ['hr_plan_link', 'Human Resource Plan'],
        ['radar_link', 'Radar Link']
      ], saveApp, app);

      sectionTitle(host, 'sec-app-hardware', 'Hardware');
      collGrid(host, app, 'hardware', hardware, [
        { key: 'sno', label: 'S.No' },
        { key: 'description', label: 'Description' },
        { key: 'spec', label: 'Confg./Specification' },
        { key: 'quantity', label: 'Quantity' },
        { key: 'start_date', label: 'Start Dt', type: 'date' },
        { key: 'end_date', label: 'End Dt', type: 'date' }
      ]);

      sectionTitle(host, 'sec-app-software', 'Software');
      collGrid(host, app, 'software', software, [
        { key: 'sno', label: 'S.No' },
        { key: 'description', label: 'Description' },
        { key: 'version', label: 'Version' },
        { key: 'installations', label: 'No. of Installations' },
        { key: 'start_date', label: 'Start Dt', type: 'date' },
        { key: 'end_date', label: 'End Dt', type: 'date' }
      ]);

      sectionTitle(host, 'sec-app-env', 'Devolopment Environments');
      collGrid(host, app, 'environments', environments, [
        { key: 'env_name', label: 'Environment' },
        { key: 'server_path', label: 'Server' },
        { key: 'access_type', label: 'Access' }
      ]);

      sectionTitle(host, 'sec-app-dar', 'Decision Analysis and Resolution');
      collGrid(host, app, 'dar', dar, [
        { key: 'sno', label: 'S.No' },
        { key: 'task', label: 'Tasks/Phase identified where formal evaluation shall be performed' },
        { key: 'participants', label: 'Participants' },
        { key: 'remarks', label: 'Remarks' }
      ]);

      sectionTitle(host, 'sec-app-hrplan', 'Human Res Plan for Application');
      {
        const tbl = document.createElement('table');
        tbl.className = 'grid';
        tbl.appendChild(headRow(['S.No', 'Period / Resource', '1st Qtr of the Year', '2nd Qtr of the Year', '3rd Qtr of the Year']));
        [['1', 'Offshore Domain Owner', '1', '1', ''],
         ['2', 'Project Owner', '1', '1', ''],
         ['3', 'Technical Team Member', '3', '3', '']].forEach((r) => {
          const tr = document.createElement('tr');
          r.forEach((c) => tr.appendChild(textCell(c)));
          tbl.appendChild(tr);
        });
        host.appendChild(tbl);
      }

      // ================= Project-Data =================
      sectionTitle(host, 'sec-proj-summary', 'Project-Data — Projects Summary');
      kvTable(host, project, [
        ['project_key', 'Project Key'],
        ['fp_count', 'FP Count'],
        ['productivity_factor', 'Productivity Factor'],
        ['project_type', 'Type'],
        ['technology', 'Tech'],
        ['brief_desc', 'Brief Desc', 'multi'],
        ['scope', 'Scope', 'multi'],
        ['start_date', 'Schedule — Start Date', 'date'],
        ['software_req', 'Software Req.'],
        ['hardware_req', 'Hardware Req.'],
        ['quality_objective', 'Quality Objective', 'multi'],
        ['life_cycle', 'Project Life Cycle', 'multi'],
        ['shared_folder_path', 'Shared folder path'],
        ['other_info', 'Other information'],
        ['avg_daily_res_pct', 'Average Daily Res %'],
        ['doc_owner_ipn', 'Doc Owner IPN']
      ], saveProj, app);
      {
        const tbl = document.createElement('table');
        tbl.className = 'grid';
        [['Total Effort(MD)', computed.totalEffMd],
         ['End Date :', fmtDate(computed.endDate)],
         ['Kick Off meeting -', fmtDate(computed.kickOffDate)],
         ['Proposed PAT Delivery Date', fmtDate(computed.proposedPatDate)],
         ['Average Resource/day', computed.avgResPerDay],
         ['Total FTE', computed.totalFte]].forEach(([k, v]) => {
          const tr = document.createElement('tr');
          const th = document.createElement('th'); th.style.width = '220px'; th.textContent = k;
          tr.appendChild(th);
          tr.appendChild(textCell(v, 'calc'));
          tbl.appendChild(tr);
        });
        host.appendChild(tbl);
        const note = document.createElement('div');
        note.className = 'note';
        note.textContent = 'Calculated: Total Effort = FP Count / Productivity Factor; End Date = Start + Effort/2 + 25; Kick Off = Start − 3.';
        host.appendChild(note);
      }

      sectionTitle(host, 'sec-proj-effort', 'Estimated Effort');
      {
        const tbl = document.createElement('table');
        tbl.className = 'grid';
        tbl.appendChild(headRow(['Phase', '%', 'MD', 'Hr']));
        phases.forEach((p) => {
          const c = computed.phases.find((x) => x.phase === p.phase) || {};
          const tr = document.createElement('tr');
          tr.appendChild(textCell(p.phase));
          tr.appendChild(inputCell(p.pct, (v) => {
            p.pct = Number(v) || 0;
            app.markDirty(() => API.put(`/projects/${app.projectId}/phases/${p.id}`, p));
          }, 'number'));
          tr.appendChild(textCell(c.md, 'calc num'));
          tr.appendChild(textCell(c.hr, 'calc num'));
          tbl.appendChild(tr);
        });
        const tot = document.createElement('tr');
        tot.appendChild(textCell('Total', 'calc'));
        tot.appendChild(textCell(phases.reduce((s, p) => s + Number(p.pct || 0), 0) + '%', 'calc num'));
        tot.appendChild(textCell(computed.totalEffMd, 'calc num'));
        tot.appendChild(textCell(computed.totalEffHr, 'calc num'));
        tbl.appendChild(tot);
        host.appendChild(tbl);

        subTitle(host, 'Estimated Effort-Consolidation');
        const tc = document.createElement('table');
        tc.className = 'grid';
        tc.appendChild(headRow(['Phase', 'Total Effort Planned MD', '%']));
        computed.consolidation.forEach((r) => {
          const tr = document.createElement('tr');
          tr.appendChild(textCell(r.phase));
          tr.appendChild(textCell(r.md, 'calc num'));
          tr.appendChild(textCell(r.pct + '%', 'calc num'));
          tc.appendChild(tr);
        });
        host.appendChild(tc);
      }

      sectionTitle(host, 'sec-proj-milestones', 'Milestone Dates');
      {
        const tbl = document.createElement('table');
        tbl.className = 'grid';
        tbl.appendChild(headRow(['Milestone', 'Start Date', 'End Date', 'Deliverable']));
        computed.milestones.forEach((m) => {
          const stored = milestones.find((x) => (x.name || '').trim() === m.name) || {};
          const tr = document.createElement('tr');
          tr.appendChild(textCell(m.name));
          tr.appendChild(textCell(fmtDate(m.start), 'calc'));
          tr.appendChild(textCell(fmtDate(m.end), 'calc'));
          if (stored.id) {
            tr.appendChild(inputCell(stored.deliverable ?? '', (v) => {
              stored.deliverable = v;
              app.markDirty(() => API.put(`/projects/${app.projectId}/milestones/${stored.id}`, stored));
            }));
          } else {
            tr.appendChild(textCell(''));
          }
          tbl.appendChild(tr);
        });
        host.appendChild(tbl);
        const note = document.createElement('div');
        note.className = 'note';
        note.textContent = 'Milestone dates are chained from the Start Date and phase efforts (as per the Data Sheet formulas). Saturdays/Sundays are not adjusted automatically.';
        host.appendChild(note);
      }

      sectionTitle(host, 'sec-proj-docs', 'Items handed over to Project Owner');
      collGrid(host, app, 'docs', docs, [
        { key: 'name', label: 'Document/Item Name' },
        { key: 'version', label: 'Version No./Specifications' },
        { key: 'copy_type', label: 'Hard copy/ Soft Copy' }
      ]);

      const listSection = (kind, id, title, colLabel) => {
        sectionTitle(host, id, title);
        const rows = lists.filter((l) => l.kind === kind);
        const tbl = document.createElement('table');
        tbl.className = 'grid';
        tbl.appendChild(headRow(['', 'S.No', colLabel]));
        rows.forEach((row) => {
          const tr = document.createElement('tr');
          const del = document.createElement('td'); del.className = 'rowhead';
          const btn = document.createElement('button');
          btn.className = 'del-btn'; btn.textContent = '×';
          btn.onclick = async () => { await API.del(`/projects/${app.projectId}/lists/${row.id}`); app.reloadAll(); };
          del.appendChild(btn); tr.appendChild(del);
          tr.appendChild(textCell(row.sno));
          const td = inputCell(row.description ?? '', (v) => {
            row.description = v;
            app.markDirty(() => API.put(`/projects/${app.projectId}/lists/${row.id}`, row));
          });
          td.style.minWidth = '500px';
          tr.appendChild(td);
          tbl.appendChild(tr);
        });
        host.appendChild(tbl);
        const add = document.createElement('button');
        add.className = 'addrow-btn';
        add.textContent = '+ Add ' + kind;
        add.onclick = () => app.addListRow(kind);
        host.appendChild(add);
      };
      listSection('constraint', 'sec-proj-constraints', 'Constraints', 'Constraint');
      listSection('dependency', 'sec-proj-dependencies', 'Dependencies', 'Dependencies');
      listSection('assumption', 'sec-proj-assumptions', 'Assumptions', 'Assumption');
      listSection('risk', 'sec-proj-risks', 'Risks', 'Risk Description');

      sectionTitle(host, 'sec-proj-training', 'Training Plan');
      collGrid(host, app, 'training', training, [
        { key: 'sno', label: 'S.No' },
        { key: 'name', label: 'Name of training' },
        { key: 'train_type', label: 'Type of training' },
        { key: 'participants', label: 'Praticipants Name/Profile' },
        { key: 'start_date', label: 'Planned start date', type: 'date' },
        { key: 'end_date', label: 'Planned End date', type: 'date' }
      ]);

      sectionTitle(host, 'sec-proj-hrplan', 'Human Resource plan — Detail Role-Wise');
      collGrid(host, app, 'hrplan', hrplan, [
        { key: 'sno', label: 'S.No' },
        { key: 'role_acronym', label: 'Role Acronym' },
        { key: 'role_name', label: 'Role' },
        { key: 'resource_name', label: 'Name of the Resource' },
        { key: 'resource_ipn', label: 'Resource Ipn' },
        { key: 'contribution_pct', label: '% Contribution', type: 'number' },
        { key: 'start_date', label: 'Start Date', type: 'date' },
        { key: 'end_date', label: 'End Date', type: 'date' }
      ]);
      {
        subTitle(host, 'Total Resources (per Role)');
        const tbl = document.createElement('table');
        tbl.className = 'grid';
        tbl.appendChild(headRow(['Roles', 'No of Res', 'No of FTE']));
        computed.roleSummary.forEach((r) => {
          const tr = document.createElement('tr');
          tr.appendChild(textCell(r.role));
          tr.appendChild(textCell(r.count, 'calc num'));
          tr.appendChild(textCell(r.fte, 'calc num'));
          tbl.appendChild(tr);
        });
        host.appendChild(tbl);
      }

      sectionTitle(host, 'sec-proj-modules', 'Module Details');
      collGrid(host, app, 'modules', modules, [
        { key: 'sno', label: 'S.No' },
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'dev_res', label: 'Dev Resources' },
        { key: 'tl_res', label: 'TL Resources' },
        { key: 'testers', label: 'Testers' }
      ]);

      sectionTitle(host, 'sec-proj-process', 'Process Planning');
      collGrid(host, app, 'process', process, [
        { key: 'sno', label: 'S.No' },
        { key: 'process_name', label: 'Process Name' },
        { key: 'applicable', label: 'Applicable (Yes/NO)' },
        { key: 'tailoring', label: 'Applicable tailoring (if any)' }
      ]);

      sectionTitle(host, 'sec-proj-goals', 'Project Goals (Metrics)');
      collGrid(host, app, 'goals', goals, [
        { key: 'sno', label: 'S.No' },
        { key: 'metric_name', label: 'Metric Name' },
        { key: 'frequency', label: 'Frequency of collection' },
        { key: 'target', label: 'Target' },
        { key: 'commitment', label: 'Commitment' },
        { key: 'source', label: 'Source of Metrics' },
        { key: 'storage', label: 'Storage Location' }
      ]);

      // ================= Resource-Data =================
      sectionTitle(host, 'sec-res-data', 'Resource-Data');
      {
        const tbl = document.createElement('table');
        tbl.className = 'grid';
        tbl.appendChild(headRow(['', 'IPN', 'Role', 'Role Description', 'First Name', 'Last Name', 'Resource Full Name', 'Res Ipn', 'Phone']));
        resources.forEach((r) => {
          const tr = document.createElement('tr');
          const del = document.createElement('td'); del.className = 'rowhead';
          const btn = document.createElement('button');
          btn.className = 'del-btn'; btn.textContent = '×';
          btn.onclick = async () => { await API.del(`/resources/${r.id}`); app.reloadAll(); };
          del.appendChild(btn); tr.appendChild(del);
          const saver = () => API.put(`/resources/${r.id}`, r);
          ['ipn', 'role', 'role_desc', 'first_name', 'last_name'].forEach((k) => {
            tr.appendChild(inputCell(r[k], (v) => { r[k] = v; app.markDirty(saver); }));
          });
          tr.appendChild(textCell(`${r.last_name || ''} ${r.first_name || ''}`.trim(), 'calc'));
          tr.appendChild(textCell(r.ipn, 'calc'));
          tr.appendChild(inputCell(r.phone, (v) => { r.phone = v; app.markDirty(saver); }));
          tbl.appendChild(tr);
        });
        host.appendChild(tbl);
        const add = document.createElement('button');
        add.className = 'addrow-btn';
        add.textContent = '+ Add resource';
        add.onclick = async () => {
          await API.post('/resources', { ipn: '', role: '', role_desc: '', first_name: '', last_name: '', phone: '' });
          app.reloadAll();
        };
        host.appendChild(add);
      }

      // ================= Standards-Data =================
      sectionTitle(host, 'sec-std-roles', 'Standards-Data — Roles & Responsibilities');
      {
        const tbl = document.createElement('table');
        tbl.className = 'grid';
        tbl.appendChild(headRow(['S.No', 'Role', 'Responsibility']));
        stdRoles.forEach((r, i) => {
          const tr = document.createElement('tr');
          tr.appendChild(textCell(i + 1));
          tr.appendChild(textCell(r.role_acronym));
          tr.appendChild(textCell(r.responsibility));
          tbl.appendChild(tr);
        });
        host.appendChild(tbl);
      }

      sectionTitle(host, 'sec-std-tools', 'Tools, Methodologies and Techniques');
      {
        const tbl = document.createElement('table');
        tbl.className = 'grid';
        tbl.appendChild(headRow(['S.No', 'Activity', 'standards/Techniques', 'Tool(s) planned/templates', 'Version No']));
        stdTools.forEach((t) => {
          const tr = document.createElement('tr');
          [t.sno, t.activity, t.standards, t.tools, t.version].forEach((c) => tr.appendChild(textCell(c)));
          tbl.appendChild(tr);
        });
        host.appendChild(tbl);
      }

      sectionTitle(host, 'sec-std-matrix', 'Stakeholder Matrix (standard)');
      {
        const tbl = document.createElement('table');
        tbl.className = 'grid';
        tbl.appendChild(headRow(['Important Activities', 'VH', 'ODO', 'PO', 'QADO', 'QA', 'TDO', 'TO', 'Project team', 'DI', 'SEPG', 'FO', 'SSM']));
        matrix.forEach((m) => {
          const tr = document.createElement('tr');
          [m.activity, m.vh, m.odo, m.po, m.qado, m.qa, m.tdo, m.tos, m.team, m.di, m.sepg, m.fo, m.ssm]
            .forEach((c) => tr.appendChild(textCell(c)));
          tbl.appendChild(tr);
        });
        host.appendChild(tbl);
      }

      sectionTitle(host, 'sec-std-folders', 'Folder Structure (standard)');
      {
        const tbl = document.createElement('table');
        tbl.className = 'grid';
        tbl.appendChild(headRow(['Phase', 'Artifact Folder', 'Others']));
        folders.forEach((f) => {
          const tr = document.createElement('tr');
          [f.phase, f.artifact_folder, f.others].forEach((c) => tr.appendChild(textCell(c)));
          tbl.appendChild(tr);
        });
        host.appendChild(tbl);
      }

      sectionTitle(host, 'sec-std-tasks', 'Task Templates (WBS generation)');
      {
        const note = document.createElement('div');
        note.className = 'note';
        note.textContent = 'Tasks copied per role when "Generate WBS" runs (Tasks_Backup sheet). Estimates scale with each resource\'s % contribution, except meetings/QA facilitation.';
        host.appendChild(note);
        const div = document.createElement('div');
        div.id = 'std-task-templates';
        host.appendChild(div);
        API.get('/standards/task-templates').then((tt) => {
          const tbl = document.createElement('table');
          tbl.className = 'grid';
          tbl.appendChild(headRow(['Role', 'Task Summary', 'Task Desc', 'Phase', 'Task Type', 'Estimate rule', 'Fixed']));
          tt.forEach((t) => {
            const tr = document.createElement('tr');
            [t.role_acronym, t.summary, t.description, t.phase, t.task_type, t.est_expr, t.fixed_share ? 'Yes' : '']
              .forEach((c) => tr.appendChild(textCell(c)));
            tbl.appendChild(tr);
          });
          div.appendChild(tbl);
        });
      }
    }
  };

  App.registerSheet(sheet);
})();
