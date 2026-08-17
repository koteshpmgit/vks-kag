-- Seed data replicated from Key Artifact Generator-V1.0.xls (sample project GICPI V1110)

-- ---------- Application ----------
INSERT INTO applications (app_name, irn_no, app_size_fp, front_office, domain, category, description,
    acceptance_criteria, life_cycle, dcv, cvs, technology, scope,
    org_chart_link, quality_plan_link, corfou_link, hr_plan_link, radar_link)
VALUES (
 'GICPI', 'IRN 007015', 500, 'DSI', 'FSC', 'Standard',
 E'GICPI Application main functionalities are\n\n1. Management of objects to be Programmed.\n2. Documentation of Management Mechanics.\n3. Additional Management Requirements\n4. Developing, Connecting and Enriching manufacturing medium term plan (PFMT)',
 E'Delivered application will be without any K1 and K2 defects.\nApplication will run as expected in the user environment.',
 'Life Cycle model will be followed as per ISDC process, which will be V-Model for MQC',
 '', '', 'VB5, C, Shellscripts, Unix',
 'To develop or enhance feautures of existing application and to take care of maintenance related activities of the application',
 'I:\sf1\PROJECT\Project Data\PROGRAMMATION\GICPI-IRN 006395\GICPI V1110\02.PLANS',
 'I:\sf1\PROJECT\Project Data\PROGRAMMATION\GICPI-IRN 006395\GICPI V1110\02.PLANS\2.7 FDA',
 'http://osa.intra.renault.fr:40090/osa/scripts/scripts_fiches_si/accueil_fsi.php?choix_ihm=corfou&menu_n1=fiche_si',
 '<Give the link Here>',
 'I:\sf1\PROJECT\Project Data\PROGRAMMATION\GICPI-IRN 006395\GICPI V1110\04.RADAR');

-- ---------- Resources (Data Sheet AH3..AN18) ----------
INSERT INTO resources (ipn, role, role_desc, first_name, last_name, phone) VALUES
 ('z003892','PO','Project Owner','Kandavel','K',''),
 ('z001276','VO','Vertical Owner','Ramaprasad','D','444784'),
 ('z000471','ODO','Offshore Domain Owner','Muthukumaran','S','444784'),
 ('z003007','DEV','Developer1','Anirban','S',''),
 ('z003314','DEV','Developer2','Guruvidya','K',''),
 ('z003892','TL','Technical Lead','Kandavel','K',''),
 ('z003007','DI','Development Integrator','Anirban','S',''),
 ('z003314','DO','Development Owner','Guruvidya','K','444784'),
 ('a185436','DSI AM','DSI Application Manager','Laurent','Sidler','33 1 76840924'),
 ('p034037','DSI DM','DSI Delivery Manager','Frederic','G','33 01 76843314'),
 ('p034037','DSI CM','DSI Contract Manager','Frederic','Guillet Andre','33 01 76843314'),
 ('z000961','TFO','Test Function Owner','Alexander','A',''),
 ('z000420','TO','Test Owner','Sambit','B',''),
 ('z000420','TSTL','Test Lead','Sambit','B',''),
 ('z001251','TSTE','Test Engineer','Ashok Kumar','A',''),
 ('z001604','PQAO','PQAO','Dhivya','S','');

-- ---------- Project ----------
INSERT INTO projects (application_id, project_key, fp_count, productivity_factor, project_type,
    technology, brief_desc, scope, start_date, software_req, hardware_req,
    quality_objective, life_cycle, shared_folder_path, other_info, avg_daily_res_pct,
    doc_owner_ipn, naming_convention)
VALUES (1, 'GICPI V1110', 29, 0.83, 'MQC',
 'VB5, C, Shellscripts, Unix',
 E'GICPI Application main functionalities are\n\n1. Management of objects to be Programmed.\n2. Documentation of Management Mechanics.\n3. Additional Management Requirements\n4. Developing, Connecting and Enriching manufacturing medium term plan (PFMT)',
 E'To handle requests on MQC from DSI.\nResponsible for application configuration in Development and Formation.(Excluding installation of WAS server).\nResponsible preparing the required artifacts for PAT delivery\nISDC will be responsible for following deliverable for MQC\n1. DSR/Impact Analysis Document.\n2. Updated DDA Document.\n3. EXE files, Batch Exe, Dll and unix scripts.\n4. Release notes.\n5. Baselined SVN Code for that MQC activity',
 '2011-04-11',
 'VB5, Visual studio installed, SVN Client, TD',
 'PC with 1GB Hard disk and 2 GB RAM',
 'Quality of ISDC deliverable to contribute to RENAULT business objectives',
 'Life Cycle model will be followed as per ISDC process, which will be V-Model for MQC',
 'I:\sf1\PROJECT\Project Data\PROGRAMMATION\GICPI-IRN 006395\GICPI V1110\',
 'None', 80, 'z001160',
 E'Cxx-PROJECT-Doc type-Chrono-LANGUAGE\nwhere\n- Cxx: Domain code\n- Project: Project identifier\n- Doc Type: Document type (minutes, CDI, etc.)\n- Chrono: document sequence number\n- Language: Language code, i.e. FR/EN if the documents are issued in two languages\ne.g. C03-MPR-CDI-015');

-- ---------- Modules (Data Sheet Z32..) ----------
INSERT INTO modules (project_id, sno, name, description, dev_res, tl_res, testers) VALUES
 (1, 1, 'GICPI V1110', '', '2 Developers', '1 Technical Lead', '1 Test Engineer');

-- ---------- Phase efforts (Data Sheet AB5..AC14) ----------
INSERT INTO phase_efforts (project_id, seq, phase, pct) VALUES
 (1, 1, 'Analysis', 8),
 (1, 2, 'Design', 11),
 (1, 3, 'Design Review', 3),
 (1, 4, 'Coding', 20),
 (1, 5, 'Code Review', 4),
 (1, 6, 'Unit Testing', 6),
 (1, 7, 'System Testing', 24),
 (1, 8, 'PM', 10),
 (1, 9, 'PAT/UAT Support', 10),
 (1,10, 'Other Efforts', 4);

-- ---------- HR plan Role-Wise (Data Sheet R80..Y95) ----------
INSERT INTO hr_plan (project_id, sno, role_acronym, role_name, resource_name, resource_ipn, contribution_pct, start_date, end_date) VALUES
 (1, 1,'PO','Project Owner','K Kandavel','z003892',30,'2011-04-11','2011-05-23'),
 (1, 2,'VO','Vertical Owner','D Ramaprasad','z001276',2,'2011-04-11','2011-05-23'),
 (1, 3,'ODO','Offshore Domain Owner','S Muthukumaran','z000471',15,'2011-04-11','2011-05-23'),
 (1, 4,'DEV','Developer1','S Anirban','z003007',60,'2011-04-11','2011-05-23'),
 (1, 5,'DEV','Developer2','K Guruvidya','z003314',60,'2011-04-11','2011-05-23'),
 (1, 6,'TL','Technical Lead','K Kandavel','z003892',5,'2011-04-11','2011-05-23'),
 (1, 7,'DI','Development Integrator','S Anirban','z003007',4,'2011-04-11','2011-05-23'),
 (1, 8,'DO','Development Owner','K Guruvidya','z003314',4,'2011-04-11','2011-05-23'),
 (1, 9,'DSI AM','DSI Application Manager','Sidler Laurent','a185436',0,'2011-04-11','2011-05-23'),
 (1,10,'DSI DM','DSI Delivery Manager','G Frederic','p034037',0,'2011-04-11','2011-05-23'),
 (1,11,'DSI CM','DSI Contract Manager','Guillet Andre Frederic','p034037',0,'2011-04-11','2011-05-23'),
 (1,12,'TFO','Test Function Owner','A Alexander','z000961',3,'2011-04-11','2011-05-23'),
 (1,13,'TO','Test Owner','B Sambit','z000420',5,'2011-04-11','2011-05-23'),
 (1,14,'TSTL','Test Lead','B Sambit','z000420',15,'2011-04-11','2011-05-23'),
 (1,15,'TSTE','Test Engineer','A Ashok Kumar','z001251',70,'2011-04-11','2011-05-23'),
 (1,16,'PQAO','PQAO','S Dhivya','z001604',3,'2011-04-11','2011-05-23');

-- ---------- Milestones (Data Sheet S21..V29). Dates recomputed by the app; deliverables kept. ----------
INSERT INTO milestones (project_id, seq, name, deliverable) VALUES
 (1, 1, 'Requirement Analysis', 'Q&A Sheet'),
 (1, 2, 'Design', 'DSR'),
 (1, 3, 'Coding & UTC execution', 'UTC'),
 (1, 4, 'System test cycle 1', 'EXE and SVN update'),
 (1, 5, 'System test cycle 2', 'EXE and SVN update'),
 (1, 6, 'PAT Delivery', 'EXE and SVN update/DDA'),
 (1, 7, 'PAT Support', 'EAR and tar file'),
 (1, 8, 'UAT Support', 'EAR and tar file'),
 (1, 9, 'Go - Live', '');

-- ---------- Hardware / Software requirements ----------
INSERT INTO hardware_requirements (project_id, sno, description, spec, quantity, start_date, end_date) VALUES
 (1, 1, 'Window Desktop', 'DELL Desktop/3GM RAM', 3, '2011-04-11', '2011-05-23'),
 (1, 2, 'Laptop', 'DELL Laptop/2GM RAM', 1, '2011-04-11', '2011-05-23');

INSERT INTO software_requirements (project_id, sno, description, version, installations, start_date, end_date) VALUES
 (1, 1, 'VB5', '3.5', 3, '2011-04-11', '2011-05-23'),
 (1, 2, 'VC 6', '8.12', 3, '2011-04-11', '2011-05-23'),
 (1, 3, 'SVN Client', '2.0.7', 3, '2011-04-11', '2011-05-23'),
 (1, 4, 'QC', '9.2', 4, '2011-04-11', '2011-05-23');

-- ---------- Constraints / Dependencies / Assumptions / Risks ----------
INSERT INTO list_items (project_id, kind, sno, description) VALUES
 (1,'constraint',1,'Constraint1'),
 (1,'constraint',2,'Constraint2'),
 (1,'constraint',3,'<None>'),
 (1,'dependency',1,'Timelines are dependent on the CDI functional points to be received from DSI'),
 (1,'dependency',2,'<None>'),
 (1,'assumption',1,'In case of access & connection related problems experienced, DSI will support to meet the dead lines.'),
 (1,'assumption',2,'<None>'),
 (1,'risk',1,'Risk1'),
 (1,'risk',2,'Risk2'),
 (1,'risk',3,'<None>');

-- ---------- Items handed over ----------
INSERT INTO docs_handed (project_id, name, version, copy_type) VALUES
 (1, 'Project initiation Note', '1', 'soft copy'),
 (1, 'Artifact checklist', '1', 'soft copy'),
 (1, 'Initial Global Plan', '1', 'soft copy');

-- ---------- Project Goals / Metrics (Data Sheet BK37..BR42) ----------
INSERT INTO project_goals (project_id, sno, metric_name, frequency, target, commitment, source, storage) VALUES
 (1, 1, 'Effort Variance', 'Milestone based and at any given point of time', '(Zero) 0%', '(Zero) 0%', 'JIRA and MS Project', 'PHD'),
 (1, 2, 'Defect per KiloEuros', 'Milestone based', '24/100 KE', '26.5/100 KE', 'Quality Center and JIRA', ''),
 (1, 3, 'Schedule Variance', 'Monthly and at any given point of time', '(Zero) 0%', '(Zero) 0%', 'MS Project', ''),
 (1, 4, 'Scope', 'Milestone based', '1', '1', 'RTM', ''),
 (1, 5, 'Metrics Objectives of this project  is as per project Metrics -  Quality objectives fixed at the organization for development/maintenance Projects, for the details refer', ' ', ' ', ' ', ' ', 'MDD');

-- ---------- Training plan ----------
INSERT INTO training_plan (project_id, sno, name, train_type, participants, start_date, end_date) VALUES
 (1, 1, 'QMS', 'E-learning', 'K Kandavel', '2011-05-25', '2011-05-29'),
 (1, 2, 'QMS', 'E-learning', 'S Anirban', '2011-05-25', '2011-05-29');

-- ---------- Process Planning (Data Sheet Z52..AB68) ----------
INSERT INTO process_planning (project_id, sno, process_name, applicable, tailoring) VALUES
 (1, 1,'Project Management','Yes',''),
 (1, 2,'Estimation','Yes',''),
 (1, 3,'Risk Management','Yes',''),
 (1, 4,'Configuration Management','Yes',''),
 (1, 5,'Requirements Management','Yes',''),
 (1, 6,'Change Management','Yes',''),
 (1, 7,'Coding and Unit Testing','Yes',''),
 (1, 8,'Testing','Yes',''),
 (1, 9,'Build and Delivery','Yes',''),
 (1,10,'Knowledge Transfer','Yes',''),
 (1,11,'Process Management','Yes',''),
 (1,13,'Design','Yes',''),
 (1,15,'Incident Management','Yes',''),
 (1,16,'Maintenance','Yes',''),
 (1,17,'Quality Assurance','Yes',''),
 (1,19,'Review','Yes',''),
 (1,20,'Security Management','Yes','');

-- ---------- Dev environments ----------
INSERT INTO dev_environments (project_id, env_name, server_path, access_type) VALUES
 (1, 'Development environment', '<Mention the server path>', '<Mention type of access >'),
 (1, 'Integration environment', '<Mention the server path>', '<Mention type of access >');

-- ---------- Decision Analysis and Resolution ----------
INSERT INTO decision_analysis (project_id, sno, task, participants, remarks) VALUES
 (1, 1, 'Task1', 'Res1', 'Remark1');

-- ---------- Kick-Off agenda ----------
INSERT INTO kickoff_agenda (project_id, sno, topic) VALUES
 (1, 1,'Project Details'),
 (1, 2,'Project Scope, Duration & Technology/Tools Used'),
 (1, 3,'Project''s Lifecycle Process & Goals'),
 (1, 4,'Milestones and Deliverables'),
 (1, 5,'Organization Chart'),
 (1, 6,'Resource Requirements'),
 (1, 7,'Hardware, Software Requirements'),
 (1, 8,'Human Resource Requirements'),
 (1, 9,'Risks and Dependencies'),
 (1,10,'Stakeholders'' Involvement'),
 (1,11,'Others'),
 (1,12,'Questions');

-- ---------- Standard roles & responsibilities (IPP 1.9) ----------
INSERT INTO std_roles (role_acronym, responsibility) VALUES
 ('VO',' -Overall responsibility for Delivery - L3 escalations,FDM activities'),
 ('ODO',' - Review responsibility of Project Mangement - L2 escalations'),
 ('PO','- Project Management - DAR Planning - Project Health Dashboard Preparation - Requirements Management - Owner of Development activities - Review for all Engineering Artifacts'),
 ('Developers',' - Developes Source Code  - Code Review and Unit Testing  - Design Preparation  - Developes Engineering Artifacts'),
 ('TFO',' - Review responsibility of Test Mangement'),
 ('TO',' - Test Planning  - Test Execution and Analysis'),
 ('Testers',' - Test Case Preparation and Execution'),
 ('PQAO',' - Process Review for Project Management Artifacts and Audits'),
 ('QAF',' - Process Review of Engineering Artifacts  - Project Facilitation'),
 ('DI',' - Responsible for Configuration Management');

-- ---------- Standard tools/methodologies (IPP 1.7) ----------
INSERT INTO std_tools (sno, activity, standards, tools, version) VALUES
 (1,'Requirements Management','','',''),
 (2,'Design','','',''),
 (3,'Code & Unit Testing','','',''),
 (4,'Testing','','',''),
 (5,'Project Management','','',''),
 (6,'Estimation','','',''),
 (7,'Planning','','',''),
 (8,'Effort tracking','','',''),
 (9,'Defect tracking','','',''),
 (10,'Change Request  Tracking','','',''),
 (11,'Risk Tracking','','',''),
 (12,'Configuration Management','','',''),
 (13,'Others <Specify>','','','');

-- ---------- Stakeholder Matrix (IPP-Stakeholder plan B5..N31) ----------
INSERT INTO stakeholder_matrix (activity, vh, odo, po, qado, qa, tdo, tos, team, di, sepg, fo, ssm, remarks) VALUES
 ('Application Initiation Note(AIN)','O','E','O','O','','O','','','O','','',''  ,''),
 ('Project planning','O','O','E','O','P','O','P','','O','','','ES',''),
 ('CORFOU','O','P','E','O','O','O','O','O','','','P','',''),
 ('Estimation Reporting','O','P','E','O','O','O','P','','O','','P','',''),
 ('Major Decsion making','O','O','E','O','O','P','P','P','O','','P','',''),
 ('Project monitoring & tracking','O','O','E','O','P','O','P','','','','P','ES',''),
 ('Configuration management plan Preparation','O','O','E','O','O','O','P','','P','','P','',''),
 ('CM audit','O','O','P','O','O','O','P','P','E','','P','',''),
 ('Impact analysis on Requirements Changes','O','O','E','O','O','O','P','P','O','','P','',''),
 ('Chenage request log','O','O','E','O','O','O','O','O','O','','P','',''),
 ('RADAR','O','P','E','O','P','O','P','P','P','','P','',''),
 ('Requirements review','O','O','E','O','O','O','P','P','P','','P','',''),
 ('QA Reviews','O','O','P','O','E','O','P','P','P','','','',''),
 ('DSR Preparation','O','O','E','O','O','O','O','P','P','','P','',''),
 ('Design Reviews','O','O','E','O','O','O','O','P','P','','O','',''),
 ('Coding','O','O','P','O','O','O','O','P','P','','O','',''),
 ('Code reviews','O','O','E','O','O','O','O','P','P','','','',''),
 ('Unit testing','O','O','E','O','O','O','O','P','P','','','',''),
 ('System test plan','O','O','O','O','O','P','E','P','O','','','',''),
 ('System testing','O','O','O','O','O','O','E','P','O','','','',''),
 ('System test report','O','O','O','O','O','O','E','P','O','','','',''),
 ('Builde note Preparation','O','O','E','O','O','O','O','P','O','','','',''),
 ('Software delivery form','O','O','E','O','P','O','P','P','O','','P','',''),
 ('Application description documents','O','O','E','O','O','O','O','P','P','','P','',''),
 ('Delivery','O','O','E','O','O','O','O','P','P','','P','',''),
 ('Metrics Reporting and Analysis','O','O','E','','P','','','','','','','',''),
 ('Project closure reporting','O','P','E','P','P','P','P','P','P','','P','','');

-- ---------- Folder Structure sheet ----------
INSERT INTO folder_structure (phase, artifact_folder, others) VALUES
 ('01.KNOWLEDGE TRANSFER','',''),
 ('02.PLANS','',''),
 ('02.PLANS','2.1 PROJECT PLAN',''),
 ('02.PLANS','2.2 WBS',''),
 ('02.PLANS','2.3 BUG & ENHANCEMENT TRACKING SHEET',''),
 ('02.PLANS','2.4 FDM',''),
 ('02.PLANS','2.5 REVIEW LOGS',''),
 ('02.PLANS','2.6 CMP',''),
 ('02.PLANS','2.7 FDA',''),
 ('03.ESTIMATION','',''),
 ('03.ESTIMATION','3.1 Estimation Report',''),
 ('03.ESTIMATION','3.2 REVIEW LOGS',''),
 ('04.RADAR','',''),
 ('05.MONITORING','',''),
 ('05.MONITORING','5.1 STATUS REPORT',''),
 ('05.MONITORING','5.2 COMMUNICATION',''),
 ('05.MONITORING','5.3 MOM',''),
 ('05.MONITORING','5.3 MOM','Team Meeting'),
 ('05.MONITORING','5.3 MOM','PO-ODO Meeting'),
 ('05.MONITORING','5.4 MAILS',''),
 ('06.REQUIREMENTS','',''),
 ('06.REQUIREMENTS','FSD',''),
 ('06.REQUIREMENTS','RTM',''),
 ('07.DESIGN','',''),
 ('07.DESIGN','7.1 MAKE RESUSE ANALYSIS',''),
 ('07.DESIGN','7.2 REVIEW LOGS',''),
 ('07.DESIGN','7.3 DSR',''),
 ('08.CODING & UNIT TESTING','',''),
 ('08.CODING & UNIT TESTING','8.1 UNIT TEST PLAN',''),
 ('08.CODING & UNIT TESTING','8.2 UNIT TEST CASE',''),
 ('08.CODING & UNIT TESTING','8.3 REPORTS',''),
 ('08.CODING & UNIT TESTING','8.4 REVIEW LOGS',''),
 ('09.TESTING','',''),
 ('09.TESTING','9.1 TEST PLANS',''),
 ('09.TESTING','9.2 TEST CASE',''),
 ('09.TESTING','9.3 TEST REPORT',''),
 ('09.TESTING','9.4 REVIEW LOGS',''),
 ('10.AUDITS & REVIEWS','',''),
 ('10.AUDITS & REVIEWS','10.1 AUDIT',''),
 ('10.AUDITS & REVIEWS','10.2 REVIEW',''),
 ('10.AUDITS & REVIEWS','10.2 REVIEW','PCR'),
 ('11.METRICS','',''),
 ('11.METRICS','11.1 METRICS REPORT',''),
 ('11.METRICS','11.2 REVIEW LOGS',''),
 ('12.TRAINING','',''),
 ('12.TRAINING','12.1 TRAINING REQUEST',''),
 ('12.TRAINING','12.2 TRAINING MATERIALS',''),
 ('13.PROJECT CLOSURE','',''),
 ('14.OTHERS','',''),
 ('14.OTHERS','Delivery Note','');

-- ---------- Task templates (Tasks_Backup sheet, used by Generate WBS / GenWBS2) ----------
-- est_expr uses phase hour tokens: analysisHr, designHr, designRevHr, codingHr, codeRevHr,
-- unitTestHr, sysTestHr, pmHr, patUatHr, othersHr, totalHr; milestones: reqStart, reqEnd,
-- designStart, designEnd, cutStart, cutEnd, sit1Start, sit1End, sit2Start, sit2End,
-- patDelStart, patSupStart, patSupEnd, uatStart, uatEnd
INSERT INTO task_templates (role_acronym, summary, description, phase, task_type, start_rule, end_rule, est_expr, fixed_share) VALUES
 ('ODO','Project Monitoring & tracking','Review Status Reports','Management','Project management','reqStart','uatEnd','(pmHr+othersHr)*0.10',false),
 ('ODO','Various Reviews','Conduct and Participate in Reviews','Management','Project management','designStart','uatEnd','(pmHr+othersHr)*0.20',false),
 ('ODO','RAP Meetings','Meeting with FO team','Management','Project Management','reqStart','uatEnd','totalHr/20',true),
 ('ODO','Review Project Schedule','Review Project Schedule','Management','Project Management','reqStart','uatEnd','(pmHr+othersHr)*0.10',false),
 ('PO','Status Reporting','Review Status Reports','Management','Project management','reqStart','uatEnd','(pmHr+othersHr)*0.20',false),
 ('PO','Metric Analysis','Metric Analysis','Management','Project management','reqStart','uatEnd','(pmHr+othersHr)*0.20',false),
 ('PO','Process documentation','Prepare IPP Estimatioon and other process documents.','Management','Project management','designStart','uatEnd','pmHr*0.15',false),
 ('PO','Participate in Status Reporting','Participate in Status Review Meetings','Management','Project management','designStart','uatEnd','(pmHr+patUatHr+othersHr)*0.10',false),
 ('PO','Team Meetings','Internal Status Meetings','Management','Team Meetings','designStart','uatEnd','totalHr/20',true),
 ('PO','RAP Meetings','Meeting with FO team','Management','Project Management','designStart','uatEnd','totalHr/20',true),
 ('PO','Review Project Schedule','Review Project Schedule','Management','Project Management','designStart','uatEnd','(pmHr+patUatHr+othersHr)*0.10',false),
 ('PO','Project Monitoring & tracking','Project Monitoring & tracking','Management','Project Management','designStart','uatEnd','(pmHr+patUatHr+othersHr)*0.20',false),
 ('TL','Build & Delivery','Build & Delivery','Management','Support','uatStart','uatEnd','othersHr*0.35',false),
 ('TL','RAP Meetings','Meetings with FO Team','Management','RAP Meetings','designStart','uatEnd','totalHr/20',true),
 ('TL','Team Meetings','Internal Status Meetings','Management','Team Meetings','designStart','uatEnd','totalHr/20',true),
 ('TL','Unit Test case review','Unit Test cas review','CUT','Unit Test Case Review','cutStart','cutEnd','unitTestHr*0.20',false),
 ('TL','OSCAR P2P review for DSR','Facilitate Participate in OSCAR DSR Review','Design','DSR Review','designStart','designEnd','codeRevHr*0.70',false),
 ('TL','Code Review','Review Facilitate Review of Code','CUT','Code Review','cutStart','cutEnd','codeRevHr*0.90',false),
 ('TL','Requirement Analysis','Requirement Analysis','Analysis','Requirement Analysis - Dev Team','reqStart','reqEnd','analysisHr*0.25',false),
 ('DEV','PPAT / UAT Support- Development','PPAT / UAT Support- Development','Support','PPAT / UAT Support- Development','patSupStart','uatEnd','pmHr*0.40',false),
 ('DEV','PAT Support -Development','PAT Support -Development','Support','PAT Support -Development','patSupStart','uatEnd','patUatHr*0.40',false),
 ('DEV','Team meetings','Internal Status Meetings','Management','Internal Status Meetings','reqStart','sit2End','totalHr/(20*8)',true),
 ('DEV','Unit Testing','Unit Testing','CUT','Unit Testing','cutStart','cutEnd','unitTestHr*0.12',false),
 ('DEV','Unit Test case rework','Unit Test cas rework','CUT','Unit Test Case Rework','cutStart','cutEnd','unitTestHr*0.10',false),
 ('DEV','Unit Test case prepartiion','Unit Test cas prepartiion','Design','Unit Test Case Preparation','designStart','designEnd','unitTestHr*0.85',false),
 ('DEV','Coding Rework','Code rework for code review','CUT','Code Rework','cutStart','cutEnd','codingHr*0.10',false),
 ('DEV','Coding Review','P2P Review code of other developers','CUT','Code Review','cutStart','cutEnd','codingHr*0.10+codeRevHr*0.10',false),
 ('DEV','Coding','Coding','CUT','Coding','cutStart','cutEnd','codingHr*0.80',false),
 ('DEV','DSR Rework','Rework for the DSR review','Design','DSR Rework','designStart','designEnd','designHr*0.10',false),
 ('DEV','DSR Review','P2P Review of Design Documents of others','Design','DSR Review','designStart','designEnd','designHr*0.10',false),
 ('DEV','DSR Preparatiion','Prepare Design Documents','Design','DSR Preparation','designStart','designEnd','designHr*0.70',false),
 ('DEV','Requirement Analysis','Requirement Analysis','Analysis','Requirement Analysis - Dev Team','reqStart','reqEnd','analysisHr*0.75',false),
 ('TSTE','Test case preparation','Test case preparation','Design','SI Test Case Preparation','reqStart','designEnd','sysTestHr*0.25',false),
 ('TSTE','Test case Review','Test case Review','Design','SI Test Case Review','designStart','designEnd','sysTestHr*0.06',false),
 ('TSTE','Test case Rework','Test case Rework','System Testing','SI Test Case Rework','sit1Start','sit1End','sysTestHr*0.06',false),
 ('TSTE','Test execution','Test execution','System Testing','SI Test Case Execution','sit1Start','sit2End','sysTestHr*0.25',false),
 ('TSTE','Requirement Analysis -Testing Team','Requirements Document study','Analysis','Requirement Analysis -Testing Team','reqStart','reqEnd','sysTestHr*0.08',false),
 ('TSTE','DSR analysis','Analysis of DSR by Teesting team','Design','DSR Analysis - Testing Team','designStart','designEnd','sysTestHr*0.05',false),
 ('TSTE','PAT Support -Testing','PAT Support -Testing','Support','PAT Support -Testing','patDelStart','patSupEnd','patUatHr*0.40',false),
 ('TSTE','PPAT Support- Testing','PPAT Support- Testing','Support','PPAT Support- Testing','uatStart','uatEnd','patUatHr*0.40',false),
 ('TSTE','Team Meetings','Team Meetings','Management','Team Meetings','reqStart','uatEnd','totalHr/20',true),
 ('TSTL','Test management','Test Management','System Testing','Project Management','designStart','uatEnd','sysTestHr*0.08',false),
 ('TSTL','Test management','PM for Testing Team','System Testing','Project Management','reqStart','uatEnd','sysTestHr*0.08',false),
 ('TSTL','Team Meetings','Team Meetings','Management','Team Meetings','reqStart','uatEnd','totalHr/20',true),
 ('TSTL','RAP Meetings','Meetings with FO Team','Management','RAP Meetings','reqStart','uatEnd','totalHr/20',true),
 ('PQAO','QA Facilitation','QA Facilitation','General','QA Facilitation','reqStart','uatEnd','othersHr*0.30',true);
