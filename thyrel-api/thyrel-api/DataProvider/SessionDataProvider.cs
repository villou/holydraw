﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Routing.Matching;
using Microsoft.EntityFrameworkCore;
using thyrel_api.Handler;
using thyrel_api.Models;
using thyrel_api.Models.DTO;

namespace thyrel_api.DataProvider
{
    public class SessionDataProvider : ISessionDataProvider
    {
        private readonly HolyDrawDbContext _holyDrawDbContext;

        public SessionDataProvider(HolyDrawDbContext context)
        {
            _holyDrawDbContext = context;
        }

        /// <summary>
        /// Create new Session
        /// </summary>
        /// <param name="roomId"></param>
        /// <param name="stepFinishAt"></param>
        /// <param name="timeDuration"></param>
        /// <param name="playerCount"></param>
        /// <returns></returns>
        public async Task<Session> Add(int roomId, DateTime stepFinishAt, int timeDuration, int playerCount)
        {
            var sessionToAdd =
                new Session(roomId, stepFinishAt, timeDuration, SessionStepType.Start, playerCount);

            // test if no session is already start
            if (await _holyDrawDbContext.Session.AnyAsync(s => s.RoomId == roomId && s.FinishAt == null))
                return null;

            var entity = await _holyDrawDbContext.Session.AddAsync(sessionToAdd);
            await SaveChanges();
            return entity.Entity;
        }

        /// <summary>
        ///     Set finishAt to DateTime.Now
        /// </summary>
        /// <param name="sessionId"></param>
        public async Task<Session> Finish(int sessionId)
        {
            var session = await _holyDrawDbContext.Session
                .FindAsync(sessionId);

            if (session == null)
                return null;
            session.FinishAt = DateTime.Now;

            await SaveChanges();
            return session;
        }

        /// <summary>
        /// To get a Session by it's id
        /// </summary>
        /// <param name="sessionId"></param>
        /// <returns></returns>
        public async Task<Session> GetSessionById(int sessionId)
        {
            var session = await _holyDrawDbContext.Session
                .FindAsync(sessionId);
            return session;
        }

        /// <summary>
        /// Get current session of a room
        /// </summary>
        /// <param name="roomId"></param>
        /// <returns></returns>
        public async Task<SessionDto> GetCurrentSessionByRoomId(int roomId)
        {
            var sessionDto = await _holyDrawDbContext.Session
                .OrderBy(s => s.CreatedAt)
                .Select(s => new SessionDto
                {
                    ActualStep = s.ActualStep,
                    RoomId = s.RoomId,
                    TimeDuration = s.TimeDuration,
                    CreatedAt = s.CreatedAt,
                    FinishAt = s.FinishAt,
                    Id = s.Id,
                    StepFinishAt = s.StepFinishAt,
                    StepType = s.StepType,
                    TotalPlayers = s.TotalPlayers,
                    CurrentAlbumId = s.CurrentAlbumId
                })
                .LastOrDefaultAsync(s => s.RoomId == roomId && s.FinishAt == null);

            return sessionDto;
        }
        
        /// <summary>
        /// Get current session of a room
        /// </summary>
        /// <param name="roomId"></param>
        /// <returns></returns>
        public async Task<List<PlayerDto>> GetCurrentPlayersInSession(int roomId)
        {
            var playersDto = await _holyDrawDbContext.Player.Where(p => p.RoomId == roomId && p.IsPlaying)
                .Select(p => new PlayerDto
                {
                    Id = p.Id,
                    Username = p.Username,
                    AvatarUrl = p.AvatarUrl,
                    IsOwner = p.IsOwner,
                    CreatedAt = p.CreatedAt,
                    RoomId = p.RoomId
                }).ToListAsync();

            return playersDto;
        }

        /// <summary>
        /// Checks if current step is finished
        /// </summary>
        /// <param name="session"></param>
        /// <returns></returns>
        public async Task<PlayerStatusDto> GetPlayerStatus(Session session)
        {
            var elementsCount = await _holyDrawDbContext.Element
                .Where(e => e.SessionId == session.Id && e.Step == session.ActualStep && e.FinishAt != null)
                .CountAsync();

            var playerStatusCount = new PlayerStatusDto
            {
                PlayerFinished = elementsCount,
                PlayerCount = session.TotalPlayers
            };

            return playerStatusCount;
        }

        /// <summary>
        ///     Start a session for a room
        /// </summary>
        /// <param name="roomId"></param>
        /// <returns></returns>
        public async Task<Session> StartSession(int roomId)
        {
            const int step = 1;
            var duration = StepTimeHandler.GetTimeForStep(SessionStepType.Start);

            var playerDataProvider = new PlayerDataProvider(_holyDrawDbContext);
            var elementDataProvider = new ElementDataProvider(_holyDrawDbContext);

            var playerCount = await _holyDrawDbContext.Player
                .Where(p => p.RoomId == roomId && p.IsConnected).CountAsync();

            var addedSession = await Add(roomId, DateTime.Now.AddSeconds(duration), duration, playerCount);

            if (addedSession == null)
                return null;

            await playerDataProvider.SetIsPlaying(roomId);
            var players = await playerDataProvider.GetPlayersByRoom(roomId);
            var elements = new List<Element>();
            players.ForEach(p => elements.Add(new Element(step, p.Id, p.Id, addedSession.Id, ElementType.Sentence)));
            await elementDataProvider.AddElements(elements);
            return addedSession;
        }

        /// <summary>
        ///     Handle the next step.
        /// </summary>
        /// <param name="session">Session given from Context</param>
        /// <returns>The edited session</returns>
        /// <exception cref="Exception">If no element candidate.</exception>
        public async Task<Session> NextStep(Session session)
        {
            var elementProvider = new ElementDataProvider(_holyDrawDbContext);
            var players = await _holyDrawDbContext.Player
                .Where(p => p.RoomId == session.RoomId && p.IsPlaying).ToListAsync();

            // test if game is finish to go to the album
            if (session.ActualStep >= players.Count)
                session.StepType = SessionStepType.Book;

            var nextStep = session.ActualStep + 1;
            session.ActualStep = nextStep;

            session.StepType = session.StepType switch
            {
                SessionStepType.Start => SessionStepType.Draw,
                SessionStepType.Draw => SessionStepType.Write,
                SessionStepType.Write => SessionStepType.Draw,
                SessionStepType.Book => SessionStepType.Book,
                _ => throw new Exception("Impossible Session.StepType case")
            };

            session.UpdateTimeForStep(StepTimeHandler.GetTimeForStep(session.StepType));

            if (session.StepType != SessionStepType.Book)
            {
                var candidates = await elementProvider.GetNextCandidateElements(session.Id);
                
                var elements = GetNextCandidatesElements(players, candidates, nextStep, session.Id,
                    session.StepType == SessionStepType.Write ? ElementType.Sentence : ElementType.Drawing);
                await elementProvider.AddElements(elements);
            }

            await SaveChanges();
            return session;
        }

        /// <summary>
        ///     Run the next album for a specified roomId
        /// </summary>
        /// <param name="roomId"></param>
        /// <returns>Session that start the album</returns>
        public async Task<Session> NextAlbum(int roomId)
        {
            var session = await _holyDrawDbContext.Session.OrderBy(e => e.CreatedAt)
                .LastOrDefaultAsync(s => s.RoomId == roomId && s.FinishAt == null);

            var creators = await _holyDrawDbContext.Element
                .Where(e => e.SessionId == session.Id && e.Step == 1)
                .OrderBy(e => e.CreatorId)
                .Select(e => e.CreatorId)
                .ToListAsync();
            if (session.CurrentAlbumId == null)
                session.CurrentAlbumId = creators.First();
            else
            {
                var prevAlbumIdIndex = creators.IndexOf((int) session.CurrentAlbumId);
                if (prevAlbumIdIndex + 1 == creators.Count) return null;
                session.CurrentAlbumId = creators[prevAlbumIdIndex + 1];
            }

            await SaveChanges();

            return session;
        }

        /// <summary>
        ///     Generate future candidates for each players
        /// </summary>
        /// <param name="players">players in session</param>
        /// <param name="candidates">all elements from the session</param>
        /// <param name="nextStep">number of the next step</param>
        /// <param name="sessionId">id of the session</param>
        /// <param name="type">Type of element</param>
        /// <returns>future elements candidate</returns>
        /// <exception cref="Exception">if no candidate can be created</exception>
        public List<Element> GetNextCandidatesElements(List<Player> players,
            List<ElementCandidateDto> candidates, int nextStep, int sessionId, ElementType type)
        {
            var elements = new List<Element>();

            players.ForEach(player =>
            {
                // get valid elements candidates
                var bannedCandidates = candidates.Where(e => e.CreatorId == player.Id);

                // choose an prev element that has not yet been chosen by another player.
                var candidate = candidates
                    .LastOrDefault(c =>
                        elements.All(e => e.InitiatorId != c.InitiatorId) &&
                        bannedCandidates.All(e => e.InitiatorId != c.InitiatorId));
                if (candidate == null)
                    throw new Exception("No element candidate valid.");

                var element = new Element(nextStep, player.Id, candidate.InitiatorId, sessionId, type);
                elements.Add(element);
            });
            return elements;
        }

        private async Task SaveChanges()
        {
            await _holyDrawDbContext.SaveChangesAsync();
        }
    }
}