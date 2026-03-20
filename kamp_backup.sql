--
-- PostgreSQL database dump
--

\restrict cELv6l0Ikaxyugl7zhSGhoUS6S6jCArYoKUqa347oS1zdqiLR3VfnOOSxoNd4zn

-- Dumped from database version 15.17 (Debian 15.17-1.pgdg13+1)
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    action character varying(255),
    entity_type character varying(100),
    entity_id uuid,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.audit_logs OWNER TO admin;

--
-- Name: brackets; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.brackets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tournament_id uuid,
    round character varying(50),
    match_id uuid,
    "position" integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.brackets OWNER TO admin;

--
-- Name: courts; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.courts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tournament_id uuid,
    name character varying(100),
    surface_type character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.courts OWNER TO admin;

--
-- Name: match_events; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.match_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    match_id uuid,
    set_id uuid,
    game_id uuid,
    event_type character varying(50),
    player_id uuid,
    point_value character varying(10),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.match_events OWNER TO admin;

--
-- Name: match_games; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.match_games (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    set_id uuid,
    game_number integer,
    player1_points integer DEFAULT 0,
    player2_points integer DEFAULT 0,
    is_tiebreak boolean DEFAULT false,
    winner_id uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.match_games OWNER TO admin;

--
-- Name: match_sets; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.match_sets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    match_id uuid,
    set_number integer,
    player1_games integer DEFAULT 0,
    player2_games integer DEFAULT 0,
    is_completed boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.match_sets OWNER TO admin;

--
-- Name: match_state; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.match_state (
    match_id uuid NOT NULL,
    current_set integer,
    current_game integer,
    player1_sets integer DEFAULT 0,
    player2_sets integer DEFAULT 0,
    player1_games integer DEFAULT 0,
    player2_games integer DEFAULT 0,
    player1_points character varying(10),
    player2_points character varying(10),
    is_tiebreak boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.match_state OWNER TO admin;

--
-- Name: matches; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.matches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tournament_id uuid,
    player1_id uuid,
    player2_id uuid,
    court_id uuid,
    round character varying(50),
    scheduled_time timestamp without time zone,
    status character varying(50),
    winner_id uuid,
    umpire_id uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.matches OWNER TO admin;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    type character varying(50),
    message text,
    status character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO admin;

--
-- Name: player_stats; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.player_stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    player_id uuid,
    matches_played integer DEFAULT 0,
    matches_won integer DEFAULT 0,
    aces integer DEFAULT 0,
    double_faults integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.player_stats OWNER TO admin;

--
-- Name: players; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.players (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    date_of_birth date,
    nationality character varying(100),
    ranking integer,
    bio text,
    profile_image_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.players OWNER TO admin;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL,
    description text
);


ALTER TABLE public.roles OWNER TO admin;

--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.schema_migrations (
    version bigint NOT NULL,
    dirty boolean NOT NULL
);


ALTER TABLE public.schema_migrations OWNER TO admin;

--
-- Name: streams; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.streams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    match_id uuid,
    stream_url text,
    platform character varying(50),
    is_live boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.streams OWNER TO admin;

--
-- Name: tournaments; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.tournaments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    location character varying(255),
    start_date date,
    end_date date,
    status character varying(50),
    created_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    surface character varying(20),
    CONSTRAINT tournaments_surface_check CHECK (((surface)::text = ANY ((ARRAY['Hard'::character varying, 'Clay'::character varying, 'Grass'::character varying])::text[])))
);


ALTER TABLE public.tournaments OWNER TO admin;

--
-- Name: users; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    email character varying(150) NOT NULL,
    password_hash text NOT NULL,
    role_id uuid,
    is_active boolean DEFAULT true,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO admin;

--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.audit_logs (id, user_id, action, entity_type, entity_id, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: brackets; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.brackets (id, tournament_id, round, match_id, "position", created_at) FROM stdin;
\.


--
-- Data for Name: courts; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.courts (id, tournament_id, name, surface_type, created_at) FROM stdin;
12071c06-7994-425c-b37b-7bf13d3bbaa4	ae57b46d-5ff5-4047-a55b-c33fa76d8185	Center Court	Clay	2026-03-18 11:39:40.839682
\.


--
-- Data for Name: match_events; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.match_events (id, match_id, set_id, game_id, event_type, player_id, point_value, created_at) FROM stdin;
83165f5a-5f05-4bdc-9cc2-8826520fe4c5	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 11:55:47.647219
57911527-3307-4b98-af6d-b2ffb71001f7	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 11:56:22.669072
a7f923b7-ae1b-491d-af91-30af2d312191	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 11:56:25.408322
e59ef277-38c0-4454-b0d7-b39e464f14d4	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 11:56:39.855977
e36f1c1b-29ef-436f-be24-0d614daa67cb	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:00:03.033331
e20c1c6a-08cd-480f-bde3-8ae56b444dd7	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:00:07.70024
eabec8ba-6ec7-44f9-8a0c-32fb6302f59b	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:00:13.217492
33e2ee5e-4470-4e75-b835-b08bccc13457	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:00:22.462084
b12cc135-deb5-4512-9048-02f77519a768	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:05:48.994364
f7bef3c2-56ac-4873-a5bb-a3f608ee85c8	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:05:52.030436
ba029670-74b7-4c6e-b71f-a36c38ce38d6	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:06:30.079444
3a4c65ac-2d66-4233-b747-6c06c9ab08ab	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:06:32.858158
8a0d8a29-f86f-434e-a75e-8d035d4ccdfd	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:06:35.516071
3842d533-6605-458d-89f1-4c73f788e109	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:06:36.966446
69375e25-2fc6-4e50-8a30-fe3a2a12bced	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:06:55.447854
6d8182e8-aca9-4a2a-a4cb-8adb552b92b2	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:06:57.643495
d19e2154-cfb1-4435-9785-fd4dc783d4fe	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:06:59.298191
9819cac5-cd1c-42f9-946f-458037af3818	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:07:02.457271
bff7c5dc-70d8-46d1-ad65-667c952f30b8	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:32:49.0457
13498578-5807-43e7-98c9-952ab87f21f9	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:32:55.289192
13c5a153-f253-42c4-a938-76eddf39c4fc	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:32:56.873829
d55ad5ea-45e3-4e37-a17b-f0a011cf490f	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:32:57.861615
785490bd-1ab2-4f34-8134-73ef3c7f5241	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:32:58.786174
30e7ce47-1d9b-4824-808a-d88f0948ec14	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:32:59.607975
0bd317c9-4adb-44f1-a990-243e4c2748a7	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:33:00.368064
b198e4c4-e689-4dd2-9ea5-baeaf0f009dc	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:33:01.116901
63ab90d3-e7c7-4a52-9c25-37c77f24af21	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:33:01.809161
23350370-fe0d-47fc-a7db-5e2803db9b11	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:33:05.190302
1036cfcf-78ea-41ad-9941-e9281f79f61c	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:33:06.541004
a92a3f82-7517-4b12-9078-ea1b1e838cd5	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:33:08.272674
cbee7b93-d54a-46b3-b4f4-91cb3ddf4d5e	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:33:09.660037
377a2859-dd47-445a-b7f3-34aca5ae84da	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:33:10.511258
b2cff65d-a7cb-4f02-b444-c420cbeda125	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:33:11.253577
be9108e1-6950-44fb-be92-e26e7547b94d	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:33:11.985565
a1b3462c-5f77-4cc1-85ab-f496a6e79b9f	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:33:12.727018
f88c2cb5-cbc4-45c2-8668-30c94aa4fd4a	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:33:14.62334
a9050933-78bc-4823-a931-96b4cec4b54f	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:33:15.673287
bd7b4984-2405-46ba-add3-3668e58b0304	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:33:16.584972
4cfc9ac8-0468-480e-84b8-32b1d37c8de1	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 12:33:25.710099
8eed27f3-8c08-4a99-b268-4e18c78fe110	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 14:13:48.959793
ffd58a93-605c-4edf-979d-f82caad17897	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 14:13:56.203039
0e646596-3ed0-4ed8-88fe-9671d05b8e77	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:52:45.506742
8cb809e9-a358-42fc-8b63-f7b096667f2c	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:52:46.460205
7860dc52-379e-4e8a-9c4e-9472eef6c1e9	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:52:47.309086
02260254-63bb-4653-b679-fc07e84d9e03	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:52:48.091361
9702229b-2248-4290-a51d-e4d92da2d63a	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:52:48.693534
bdb0bf74-b3f1-4e82-a61f-9a6a4d396753	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:52:50.026128
932f65d6-ff51-4eb3-bf4d-5b1040c84d92	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:52:50.577528
c4b6d8c7-a103-496e-8469-0c3cee02e703	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:52:51.091554
91eb4315-3a2b-4e66-89ed-63a1eeb0eb5b	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:52:51.542538
72cba3ab-cdd5-44ea-8eca-b8e0fd3fa870	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:52:52.027087
e74f7470-9112-486c-a526-750660849be5	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:52:53.025684
1ddce68c-6727-4670-b949-81750a52f5cb	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:52:53.793011
2fe905b8-73f0-44e8-b280-b8d625449845	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:52:54.725038
ff0b0ba2-3462-4676-8d61-532541fe43a3	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:52:56.393831
0d5ff0d5-329b-41d1-a4a3-6d30f1af5747	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:52:57.15905
648a0d86-5037-41b2-adba-25e19741af1c	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:52:57.974954
4bffd2e5-ed31-4c33-b841-380891cd9db4	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:52:58.641537
ee6e3d1c-36a7-4d58-9812-7bf83297a688	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:52:59.409417
18f08155-b044-49ad-a2ab-92bde60e96fe	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:00.108833
d22ae319-b44c-4074-8cbb-0448e18ca949	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:00.807487
5e502d68-60d0-4e4a-a485-fcc690535401	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:01.495461
daaaa6e9-c5bc-48e6-9336-780e7dd69d26	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:05.294728
a375a99b-d2a4-407a-8436-8c4a5440d510	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:06.160641
3f21ca05-df55-4772-8bd4-9900fd3dfce0	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:06.80899
fe23d0c8-956a-41e3-ae34-96a002af4a58	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:07.509849
42361677-5ff5-4736-a938-7bb0f5668408	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:09.360637
e4cf173c-bd00-441e-8af9-0d7afe358fe7	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:10.343859
3bd9a216-8534-4a2b-ab2a-3ae8cb53acaa	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:10.945334
d6690f6a-8980-4b08-9d42-096ade67d7fb	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:11.476643
03ebd496-49d1-4fcd-a27a-de0ab6e47a72	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:12.176095
a6639400-5617-4db1-87d5-fc5cf46bcbe0	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:12.927337
9ef9f68b-e422-44a0-be8f-ae31fa12cc33	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:13.580611
cfe55986-60d2-4a02-bdc4-01e8e2c82c36	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:14.360376
95d328bd-4a96-4255-9f19-4ec1d3592b99	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:15.191436
b6737e90-7c8e-4868-aa54-e6103b3097f9	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:15.976456
91eef29c-b1c0-4161-9d18-978f8f0f3a65	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:16.475885
3c96c826-cafa-449d-b54f-bc75488057ae	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:16.976182
e1018907-8e23-42cc-9e90-657b08999eba	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:18.07629
4b578354-d6a9-445b-9199-ccc13121a7f3	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:18.627111
7618c80f-4865-49ee-a779-752b71cbb432	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:19.142199
b6a996e1-d73d-445a-ac84-e6db72d962fe	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:19.708638
a2e0aa3f-6db4-48b8-9adb-31fb0a95f8b9	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:20.726818
1b92c7ed-0e3f-45f7-82e3-16c010d38e54	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:21.108811
629f0c3d-17f6-4ed8-9e1b-b2e9fd286546	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:21.508263
c4fb9045-2a1e-49ba-b0f1-4d69c788fd3c	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:22.208325
f3cd9821-ef87-495e-b03d-fbb8b38961e9	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:23.909859
6cb80503-cb3f-4a9b-b14e-db831da2f647	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:24.241454
b4dbfbed-c42e-4201-be12-72b3723186ca	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:24.80905
a0383c71-0be1-435f-acff-f95a32b0bf44	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:25.125272
bfc2d11e-a96e-4e04-a137-805fa0626777	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:25.391727
cfeb96c3-aac0-46f2-b363-fcba21e9d992	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:26.143397
41ed4d2c-23b1-49cc-9282-1a56b1515373	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:26.874709
1d571529-5335-4dff-a064-7a771fa67b5b	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:27.475475
9917e5a9-c16d-4c6e-849e-356ea0374f9d	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:34.861448
a4c723ba-3c44-40c7-ad13-7770c2a4bf51	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:35.259671
53bb616d-b7d9-4079-81a9-ccf14f85f9fb	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:35.57798
7d78df1f-864d-43d1-a1aa-f7f90e2f533c	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:42.983063
b8264b24-2856-48ef-9ee3-9f2dff4b9d8c	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:43.79183
9a8a5f63-485a-4297-8207-bec40883f6c6	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 15:53:44.842157
fff209f2-af57-44c6-b473-a7ecacf4bf5c	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:00:57.249634
c05372ea-549c-4687-b1a0-099490f98004	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:00:58.923426
83e74f98-d26c-4a56-bee3-fa1f59a1a7f8	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:00:59.487684
52eb9eac-ed46-48bc-ba6e-71b4d6b4744d	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:00.359187
870dc671-3412-44e0-bbcc-d5337e6c5a8f	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:00.655314
c249e63a-c3e1-40a3-8fcd-20cfe1f98c13	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:01.007281
def99685-4959-42f5-a552-96b18fbab178	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:01.289904
16a1e681-8ece-4c91-9476-9c6fcf7a4e97	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:02.445052
e4746ee0-5176-4058-b1f5-23d8b052b0ff	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:02.91062
1db64aa9-ed7d-4bad-816c-1ac777d70836	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:03.142508
dbae5766-5268-41d6-ab55-e813b5e69451	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:04.043892
8ce62164-d067-4c24-b8a5-2b8b10c9a9e8	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:04.375473
223ba335-7fea-41f3-810d-d4790a3f2604	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:04.726938
3f92626c-1a90-46dc-873a-4f3b0cb1a0d1	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:12.611891
2f307d9a-6c1a-4bfc-a8fa-15d518c08c7e	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:15.861491
523ad769-0533-4621-89e9-d15e476c95d7	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:16.944365
8e3303c3-1477-4af1-9e8e-d78de6a70d1f	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:17.826103
043fe81a-d727-4418-bbe7-84d7f56c81e8	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:18.393432
b47a0f09-595b-4e3a-bb4d-f7e9d4d160a4	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:19.377828
435d0053-f979-4712-865d-3b217d97596d	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:20.275477
8b0ff8a9-eca3-4b28-816e-aa36d5e0a8fd	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:21.53271
2df9f472-b43a-4392-85aa-daf5a8c0558e	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:21.909044
a6eb0af7-5bab-42f3-b1f7-deba6f012537	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:22.342385
8c975253-9b54-4487-bb4b-72bbad91b96e	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:23.309799
76e3a42f-aa61-485c-a1c5-e4d0efcea30e	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:23.610284
20c00f43-dc2b-4b73-b76f-efb7754e629d	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:24.494375
bb5e0e7d-fac9-4e93-83f8-88a8b0d2f52c	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:24.783403
ff9beaa8-93be-4e98-ac0c-2bbf26caac14	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:25.328545
3f1056db-01ed-4670-9dbe-596b44581483	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:25.726986
63ef9f96-a49a-4c1e-9fb8-5b08b4391cef	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:26.592511
d673a043-155b-44b6-910a-c797b52fc37d	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:26.961504
70d80dde-53fd-4fc3-b9de-ccb2153d3038	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:27.406704
5e8942a5-6f37-43b2-90dc-73233594fccb	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:27.877215
5998cd40-5031-4363-87ca-cf49313f6858	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:29.15918
9e92eece-bdc5-43a3-bb2d-dff5818bbfe8	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:29.541341
ed8995f0-d81d-4369-bb13-ca64fdbf35ae	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:29.760909
12e09ddc-e106-4142-9f86-faafc70ac13b	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:30.242462
0608f702-18d4-45e5-bca0-67cffa31292b	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:30.697268
25b1e9a4-d857-4044-a443-0f6443d99eed	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 21:01:31.674297
31c47f29-2609-44d1-a768-15dd964fc945	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 22:58:01.968394
30bbb4c7-ba87-49bc-b4ce-423a7e185264	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 22:58:02.746467
267d1340-8c7c-461a-b07f-beacbb51314e	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-18 22:58:03.414168
b516d856-b281-4a44-8bbd-39ee48f7ac4c	64834521-15a0-4734-afab-2103501f17cd	\N	\N	POINT	\N		2026-03-19 07:19:06.535735
\.


--
-- Data for Name: match_games; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.match_games (id, set_id, game_number, player1_points, player2_points, is_tiebreak, winner_id, created_at) FROM stdin;
\.


--
-- Data for Name: match_sets; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.match_sets (id, match_id, set_number, player1_games, player2_games, is_completed, created_at) FROM stdin;
\.


--
-- Data for Name: match_state; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.match_state (match_id, current_set, current_game, player1_sets, player2_sets, player1_games, player2_games, player1_points, player2_points, is_tiebreak, updated_at) FROM stdin;
64834521-15a0-4734-afab-2103501f17cd	1	1	0	0	5	3	0	0	f	2026-03-19 07:19:06.551674
\.


--
-- Data for Name: matches; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.matches (id, tournament_id, player1_id, player2_id, court_id, round, scheduled_time, status, winner_id, umpire_id, created_at, updated_at) FROM stdin;
73e7c79a-c8d3-430b-b826-2aaa9a18c055	ae57b46d-5ff5-4047-a55b-c33fa76d8185	27ee0189-d1f8-4f7f-adb2-8f3d0c94dd32	e45fcd13-d1ec-442a-9359-e7a11b122371	12071c06-7994-425c-b37b-7bf13d3bbaa4	Semifinal	2026-03-19 09:18:42.192402	scheduled	\N	\N	2026-03-19 07:18:42.192402	2026-03-19 07:18:42.192402
64834521-15a0-4734-afab-2103501f17cd	ae57b46d-5ff5-4047-a55b-c33fa76d8185	b47b3a6b-84fb-4fb9-8105-2f008f2db8cc	12766b39-1005-4ace-9a8f-05b2c83158ee	12071c06-7994-425c-b37b-7bf13d3bbaa4	Quarterfinal	2026-03-18 11:44:16.686001	scheduled	\N	\N	2026-03-18 11:44:16.686001	2026-03-18 11:44:16.686001
975d408a-87eb-47de-bbb3-052ea19cf589	ae57b46d-5ff5-4047-a55b-c33fa76d8185	b47b3a6b-84fb-4fb9-8105-2f008f2db8cc	12766b39-1005-4ace-9a8f-05b2c83158ee	12071c06-7994-425c-b37b-7bf13d3bbaa4	Semifinal	2026-03-19 13:05:03.768265	live	\N	\N	2026-03-19 13:20:03.768265	2026-03-19 13:20:03.768265
b0d7b288-ee85-4fb3-814e-5e92f9488ad1	ae57b46d-5ff5-4047-a55b-c33fa76d8185	27ee0189-d1f8-4f7f-adb2-8f3d0c94dd32	e45fcd13-d1ec-442a-9359-e7a11b122371	12071c06-7994-425c-b37b-7bf13d3bbaa4	Semifinal	2026-03-19 13:10:03.768265	live	\N	\N	2026-03-19 13:20:03.768265	2026-03-19 13:20:03.768265
53f87406-c7f1-4042-b58d-4bda3c1b5b6d	ae57b46d-5ff5-4047-a55b-c33fa76d8185	b47b3a6b-84fb-4fb9-8105-2f008f2db8cc	27ee0189-d1f8-4f7f-adb2-8f3d0c94dd32	12071c06-7994-425c-b37b-7bf13d3bbaa4	Quarterfinal	2026-03-19 13:15:03.768265	live	\N	\N	2026-03-19 13:20:03.768265	2026-03-19 13:20:03.768265
84ff59c9-8419-4ecb-904a-3396778248a6	ae57b46d-5ff5-4047-a55b-c33fa76d8185	12766b39-1005-4ace-9a8f-05b2c83158ee	e45fcd13-d1ec-442a-9359-e7a11b122371	12071c06-7994-425c-b37b-7bf13d3bbaa4	Quarterfinal	2026-03-19 11:20:03.768265	completed	12766b39-1005-4ace-9a8f-05b2c83158ee	\N	2026-03-19 13:20:03.768265	2026-03-19 13:20:03.768265
2324d0ea-f1db-48ea-a352-4e15bf2d23bf	ae57b46d-5ff5-4047-a55b-c33fa76d8185	27ee0189-d1f8-4f7f-adb2-8f3d0c94dd32	b47b3a6b-84fb-4fb9-8105-2f008f2db8cc	12071c06-7994-425c-b37b-7bf13d3bbaa4	Quarterfinal	2026-03-19 10:20:03.768265	completed	b47b3a6b-84fb-4fb9-8105-2f008f2db8cc	\N	2026-03-19 13:20:03.768265	2026-03-19 13:20:03.768265
f253877e-871e-4665-b13d-f5b82f2a0153	ae57b46d-5ff5-4047-a55b-c33fa76d8185	e45fcd13-d1ec-442a-9359-e7a11b122371	12766b39-1005-4ace-9a8f-05b2c83158ee	12071c06-7994-425c-b37b-7bf13d3bbaa4	Round of 16	2026-03-19 08:20:00	completed	12766b39-1005-4ace-9a8f-05b2c83158ee	\N	2026-03-19 13:20:03.768265	2026-03-19 17:13:36.640469
552606d2-9920-4744-8ca0-9c587aee5ed7	\N	9cb9151d-4794-4915-90ac-bbd339c14798	eb05b38e-af56-4947-8134-c52732d0a95e	\N	Group	2026-03-20 17:14:00	scheduled	\N	\N	2026-03-19 17:14:32.885012	2026-03-19 17:14:32.885012
c84ff616-0622-4626-8593-2f58e8b6bc77	\N	eb05b38e-af56-4947-8134-c52732d0a95e	5110bfb4-098b-4b3d-a54b-b12eaa6e55d5	\N	Group	2026-03-21 13:08:00	scheduled	\N	\N	2026-03-20 13:09:20.829678	2026-03-20 13:09:20.829678
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.notifications (id, user_id, type, message, status, created_at) FROM stdin;
\.


--
-- Data for Name: player_stats; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.player_stats (id, player_id, matches_played, matches_won, aces, double_faults, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: players; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.players (id, first_name, last_name, date_of_birth, nationality, ranking, bio, profile_image_url, created_at, updated_at) FROM stdin;
b47b3a6b-84fb-4fb9-8105-2f008f2db8cc	Carlos	Alcaraz	2003-05-05	Spain	1			2026-03-18 09:49:24.050269	2026-03-18 09:49:24.050269
12766b39-1005-4ace-9a8f-05b2c83158ee	Jannik	Sinner	2001-08-16	Italy	2			2026-03-18 10:11:40.208779	2026-03-18 10:11:40.208779
27ee0189-d1f8-4f7f-adb2-8f3d0c94dd32	Alexander	Zverev	1997-04-20	Germany	5			2026-03-19 07:09:45.227118	2026-03-19 07:09:45.227118
e45fcd13-d1ec-442a-9359-e7a11b122371	Ben	Shelton	2002-10-09	USA	15			2026-03-19 07:09:45.227118	2026-03-19 07:09:45.227118
1e6f08f8-e07b-44dd-9276-eb675ded09dd	Novak	Djokovic	1987-05-22	Serbia	3			2026-03-19 13:18:47.343574	2026-03-19 13:18:47.343574
9cb9151d-4794-4915-90ac-bbd339c14798	Daniil	Medvedev	1996-02-11	Russia	4			2026-03-19 13:18:47.343574	2026-03-19 13:18:47.343574
3448e35a-a46a-4fe9-840b-447ab9d1e9b8	Stefanos	Tsitsipas	1998-08-12	Greece	6			2026-03-19 13:18:47.343574	2026-03-19 13:18:47.343574
5e7e15af-5e95-48f5-b9a2-d4b11bdea267	Andrey	Rublev	1997-10-20	Russia	7			2026-03-19 13:18:47.343574	2026-03-19 13:18:47.343574
20c21b83-2ff7-48ae-a646-fcd888fb3b96	Holger	Rune	2003-04-29	Denmark	8			2026-03-19 13:18:47.343574	2026-03-19 13:18:47.343574
eb05b38e-af56-4947-8134-c52732d0a95e	Casper	Ruud	1998-12-22	Norway	9			2026-03-19 13:18:47.343574	2026-03-19 13:18:47.343574
59ce1c51-4ba3-42e4-806f-65fced64e4f0	Taylor	Fritz	1997-10-28	USA	10			2026-03-19 13:18:47.343574	2026-03-19 13:18:47.343574
333ffb54-7f92-4145-b616-0ea973e06a88	Alex	de Minaur	1999-02-17	Australia	11			2026-03-19 13:18:47.343574	2026-03-19 13:18:47.343574
00fc0d93-08b9-4b91-a349-8e6edf1680ce	Grigor	Dimitrov	1991-05-16	Bulgaria	12			2026-03-19 13:18:47.343574	2026-03-19 13:18:47.343574
5110bfb4-098b-4b3d-a54b-b12eaa6e55d5	Felix	Auger-Aliassime	2000-08-08	Canada	13			2026-03-19 13:18:47.343574	2026-03-19 13:18:47.343574
efc0a892-ef2d-44d7-a9a9-248442652af8	Karen	Khachanov	1996-05-21	Russia	14			2026-03-19 13:18:47.343574	2026-03-19 13:18:47.343574
751dbe38-be36-4a94-8bc7-b9664a76562a	Frances	Tiafoe	1998-01-20	USA	16			2026-03-19 13:18:47.343574	2026-03-19 13:18:47.343574
8f028c34-acd5-4718-bd0a-a587e55f65be	Jeffer	Youngmann	2003-06-19	Ghana	20			2026-03-19 16:43:38.370176	2026-03-19 16:43:38.370176
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.roles (id, name, description) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.schema_migrations (version, dirty) FROM stdin;
1	f
\.


--
-- Data for Name: streams; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.streams (id, match_id, stream_url, platform, is_live, created_at) FROM stdin;
\.


--
-- Data for Name: tournaments; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.tournaments (id, name, location, start_date, end_date, status, created_by, created_at, updated_at, surface) FROM stdin;
ae57b46d-5ff5-4047-a55b-c33fa76d8185	Run For A Cure Africa	Accra Lawn Tennis Club	2026-03-21	2026-03-21	scheduled	\N	2026-03-18 09:43:15.057529	2026-03-18 09:43:15.057529	Clay
4e39c16a-799f-472a-a8c5-457e7c73b1b8	Accra Lawn Ranking Tournament	Accra Lawn Tennis Club	2026-03-23	2026-03-29	scheduled	\N	2026-03-20 13:27:09.772994	2026-03-20 13:27:09.772994	Clay
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.users (id, first_name, last_name, email, password_hash, role_id, is_active, last_login, created_at, updated_at) FROM stdin;
\.


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: brackets brackets_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.brackets
    ADD CONSTRAINT brackets_pkey PRIMARY KEY (id);


--
-- Name: courts courts_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.courts
    ADD CONSTRAINT courts_pkey PRIMARY KEY (id);


--
-- Name: match_events match_events_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.match_events
    ADD CONSTRAINT match_events_pkey PRIMARY KEY (id);


--
-- Name: match_games match_games_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.match_games
    ADD CONSTRAINT match_games_pkey PRIMARY KEY (id);


--
-- Name: match_sets match_sets_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.match_sets
    ADD CONSTRAINT match_sets_pkey PRIMARY KEY (id);


--
-- Name: match_state match_state_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.match_state
    ADD CONSTRAINT match_state_pkey PRIMARY KEY (match_id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: player_stats player_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.player_stats
    ADD CONSTRAINT player_stats_pkey PRIMARY KEY (id);


--
-- Name: players players_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: streams streams_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.streams
    ADD CONSTRAINT streams_pkey PRIMARY KEY (id);


--
-- Name: tournaments tournaments_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tournaments
    ADD CONSTRAINT tournaments_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_events_match; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_events_match ON public.match_events USING btree (match_id);


--
-- Name: idx_events_time; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_events_time ON public.match_events USING btree (created_at);


--
-- Name: idx_matches_schedule; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_matches_schedule ON public.matches USING btree (scheduled_time);


--
-- Name: idx_matches_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_matches_status ON public.matches USING btree (status);


--
-- Name: idx_matches_tournament; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_matches_tournament ON public.matches USING btree (tournament_id);


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);


--
-- Name: idx_players_ranking; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_players_ranking ON public.players USING btree (ranking);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: brackets brackets_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.brackets
    ADD CONSTRAINT brackets_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id);


--
-- Name: brackets brackets_tournament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.brackets
    ADD CONSTRAINT brackets_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;


--
-- Name: courts courts_tournament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.courts
    ADD CONSTRAINT courts_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;


--
-- Name: match_events match_events_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.match_events
    ADD CONSTRAINT match_events_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.match_games(id);


--
-- Name: match_events match_events_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.match_events
    ADD CONSTRAINT match_events_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;


--
-- Name: match_events match_events_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.match_events
    ADD CONSTRAINT match_events_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id);


--
-- Name: match_events match_events_set_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.match_events
    ADD CONSTRAINT match_events_set_id_fkey FOREIGN KEY (set_id) REFERENCES public.match_sets(id);


--
-- Name: match_games match_games_set_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.match_games
    ADD CONSTRAINT match_games_set_id_fkey FOREIGN KEY (set_id) REFERENCES public.match_sets(id) ON DELETE CASCADE;


--
-- Name: match_games match_games_winner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.match_games
    ADD CONSTRAINT match_games_winner_id_fkey FOREIGN KEY (winner_id) REFERENCES public.players(id);


--
-- Name: match_sets match_sets_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.match_sets
    ADD CONSTRAINT match_sets_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;


--
-- Name: match_state match_state_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.match_state
    ADD CONSTRAINT match_state_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;


--
-- Name: matches matches_court_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_court_id_fkey FOREIGN KEY (court_id) REFERENCES public.courts(id);


--
-- Name: matches matches_player1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_player1_id_fkey FOREIGN KEY (player1_id) REFERENCES public.players(id);


--
-- Name: matches matches_player2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_player2_id_fkey FOREIGN KEY (player2_id) REFERENCES public.players(id);


--
-- Name: matches matches_tournament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;


--
-- Name: matches matches_umpire_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_umpire_id_fkey FOREIGN KEY (umpire_id) REFERENCES public.users(id);


--
-- Name: matches matches_winner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_winner_id_fkey FOREIGN KEY (winner_id) REFERENCES public.players(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: player_stats player_stats_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.player_stats
    ADD CONSTRAINT player_stats_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE CASCADE;


--
-- Name: streams streams_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.streams
    ADD CONSTRAINT streams_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;


--
-- Name: tournaments tournaments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tournaments
    ADD CONSTRAINT tournaments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- PostgreSQL database dump complete
--

\unrestrict cELv6l0Ikaxyugl7zhSGhoUS6S6jCArYoKUqa347oS1zdqiLR3VfnOOSxoNd4zn

