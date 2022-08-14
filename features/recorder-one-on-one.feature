Feature: One On One Recorder controller =>

  @recorder
  @one-on-one
  @TMU-27981
  @Ron-test
  Scenario: one on one recording, upload to Mstore replacment
    Given System is running on MCU_HOME
    Then enable skip by environment
    Given create conference 880007
    Given caseType is WITH_RECORDING_HEADER
    When INVITE participant Chandler with meetingId context and audio roomType
    And participant Chandler send create conference INFO on audio room
    And JOIN participant Chandler with meetingId context and roomType audio
    When INVITE participant Joey with meetingId context and audio roomType
    And JOIN participant Joey with meetingId context and roomType audio
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | Chandler    | context   | audio    | noam     |
      | Joey        | context   | audio    | eran     |
    And Chandler START ONE_ON_ONE record1 in context meetingID
    Then Sleep 120 sec in case STREAM set to TRUE
    And Chandler STOP ONE_ON_ONE record1 in context meetingID
    Then validate NOTIFY INFO for succeed stop is received after 5 sec for Chandler with messageIndex 1 and recordEnd: record.terminate
    Then validate NOTIFY INFO for exit stop is received after 5 sec for Chandler with messageIndex 2 and stopEnd: msml.dialog.exit
    Then Sleep 10 sec in case STREAM set to TRUE
    And Chandler TRANSFER ONE_ON_ONE record1 in context meetingID
    Then validate NOTIFY INFO for succeed transfer is received after 5 sec for Chandler with messageIndex 3 and transferEnd: transfer.complete
    Then validate NOTIFY INFO for exit transfer is received after 5 sec for Chandler with messageIndex 4 and transferEnd: msml.dialog.exit
    Then Sleep 10 sec in case STREAM set to TRUE
    Then destroy audio room with meetingId context for host Chandler

  @Ron-test
  Scenario: one on one recording,  3 users upload to Mstore replacment
    Given System is running on MCU_HOME
    Then enable skip by environment
    Given create conference 880007
    Given caseType is WITH_RECORDING_HEADER
    When INVITE participant Chandler with meetingId context and audio roomType
    And participant Chandler send create conference INFO on audio room
    And JOIN participant Chandler with meetingId context and roomType audio
    When INVITE participant Ross with meetingId context and audio roomType
    And JOIN participant Ross with meetingId context and roomType audio
    When INVITE participant Joey with meetingId context and audio roomType
    And JOIN participant Joey with meetingId context and roomType audio
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | Chandler    | context   | audio    | noam     |
      | Ross        | context   | audio    | yotam     |
      | Joey        | context   | audio    | eran     |
    And Chandler START ONE_ON_ONE record1 in context meetingID
    Then Sleep 120 sec in case STREAM set to TRUE
    And Chandler STOP ONE_ON_ONE record1 in context meetingID
    Then validate NOTIFY INFO for succeed stop is received after 5 sec for Chandler with messageIndex 1 and recordEnd: record.terminate
    Then validate NOTIFY INFO for exit stop is received after 5 sec for Chandler with messageIndex 2 and stopEnd: msml.dialog.exit
    Then Sleep 10 sec in case STREAM set to TRUE
    And Chandler TRANSFER ONE_ON_ONE record1 in context meetingID
    Then validate NOTIFY INFO for succeed transfer is received after 5 sec for Chandler with messageIndex 3 and transferEnd: transfer.complete
    Then validate NOTIFY INFO for exit transfer is received after 5 sec for Chandler with messageIndex 4 and transferEnd: msml.dialog.exit
    Then Sleep 10 sec in case STREAM set to TRUE
    Then destroy audio room with meetingId context for host Chandler

  @recorder
  @one-on-one
  @TMU-29816
#  @nightly
  Scenario: one on one recording with leave participants, upload to Mstore replacment
    Given System is running on MCU_HOME
    Then enable skip by environment
    Given create conference 880008
    Given caseType is WITH_RECORDING_HEADER
    When INVITE participant Monica with meetingId context and audio roomType
    And participant Monica send create conference INFO on audio room
    And JOIN participant Monica with meetingId context and roomType audio
    When INVITE participant Joey with meetingId context and audio roomType
    And JOIN participant Joey with meetingId context and roomType audio
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | Monica      | context   | audio    | audio1     |
      | Joey        | context   | audio    | audio5     |
    And Monica START ONE_ON_ONE record_1 in context meetingID
    Then Sleep 20 sec in case STREAM set to TRUE
    And Monica STOP ONE_ON_ONE record_1 in context meetingID
    Then validate NOTIFY INFO for succeed stop is received after 5 sec for Monica with messageIndex 1 and recordEnd: record.terminate
    Then validate NOTIFY INFO for exit stop is received after 5 sec for Monica with messageIndex 2 and stopEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And Monica TRANSFER ONE_ON_ONE record_1 in context meetingID
    Then validate NOTIFY INFO for succeed transfer is received after 5 sec for Monica with messageIndex 3 and transferEnd: transfer.complete
    Then validate NOTIFY INFO for exit transfer is received after 5 sec for Monica with messageIndex 4 and transferEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And leave participant:
      | Participant | meetingID | roomType     |      caseType         |
      | Monica      | context   | audio        | WITH_RECORDING_HEADER |
      | Joey        | context   | audio        | WITH_RECORDING_HEADER |
    Then destroy audio room with meetingId context for host Monica

  @recorder
  @one-on-one
  @hold-resume
  @TMU-30567
  Scenario: one on one recording with hold resume, upload to Mstore replacment
    Given System is running on MCU_HOME
    Then enable skip by environment
    Given create conference 880009
    Given caseType is WITH_RECORDING_HEADER
    When INVITE participant Monica with meetingId context and audio roomType
    And participant Monica send create conference INFO on audio room
    And JOIN participant Monica with meetingId context and roomType audio
    When INVITE participant Joey with meetingId context and audio roomType
    And JOIN participant Joey with meetingId context and roomType audio
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | Monica      | context   | audio    | audio1     |
      | Joey        | context   | audio    | audio5     |
    And Monica START ONE_ON_ONE record1 in context meetingID
    Then Sleep 10 sec in case STREAM set to TRUE
#    HOLD
    And Monica reInvite in audio-video roomType as sendonly
    And Joey reInvite in audio roomType as recvonly-
    And Monica STOP ONE_ON_ONE record1 in context meetingID
    Then validate NOTIFY INFO for succeed stop is received after 5 sec for Monica with messageIndex 1 and recordEnd: record.terminate
    Then validate NOTIFY INFO for exit stop is received after 5 sec for Monica with messageIndex 2 and stopEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
  #    RESUME
    And Monica reInvite in audio-video roomType as sendrecv
    And Joey reInvite in audio-video roomType as sendrecv
    And Monica START ONE_ON_ONE record1 in context meetingID
    Then Sleep 10 sec in case STREAM set to TRUE
    And Monica STOP ONE_ON_ONE record1 in context meetingID
    Then validate NOTIFY INFO for succeed stop is received after 5 sec for Monica with messageIndex 3 and recordEnd: record.terminate
    Then validate NOTIFY INFO for exit stop is received after 5 sec for Monica with messageIndex 4 and stopEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And Monica TRANSFER ONE_ON_ONE record1 in context meetingID
    Then validate NOTIFY INFO for succeed transfer is received after 5 sec for Monica with messageIndex 5 and transferEnd: transfer.complete
    Then validate NOTIFY INFO for exit transfer is received after 5 sec for Monica with messageIndex 6 and transferEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    Then destroy audio room with meetingId context for host Monica

  @one-on-one
  @video-recvonly-in-sdp
  @TMU-31308
  Scenario: one on one recording - video recvonly in SDP
    Given System is running on MCU_HOME
    Then enable skip by environment
    Given create conference 880011
    Given caseType is WITH_RECORDING_HEADER
    When INVITE participant Monica with meetingId context and audio roomType caseType SDP_VIDEO_RECVONLY
    And participant Monica send create conference INFO on audio room
    And JOIN participant Monica with meetingId context and roomType audio
    When INVITE participant Joey with meetingId context and audio roomType
    And JOIN participant Joey with meetingId context and roomType audio
    Then destroy audio room with meetingId context for host Monica

  @recorder
  @one-on-one
  @TMU-31251
  Scenario: one on one recording, with video INVITE
    Given System is running on MCU_HOME
    Then enable skip by environment
    Given create conference 880010
    Given caseType is WITH_RECORDING_HEADER
    When INVITE participant Chandler with meetingId context and audio roomType caseType SDP_VIDEO_SENDRECV
    And participant Chandler send create conference INFO on audio room
    And JOIN participant Chandler with meetingId context and roomType audio
    When INVITE participant Ross with meetingId context and audio roomType caseType SDP_VIDEO_SENDRECV
    And JOIN participant Ross with meetingId context and roomType audio
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | Chandler    | context   | audio    | audio1     |
      | Ross        | context   | audio    | audio5     |
    And Chandler START ONE_ON_ONE record_1 in context meetingID
    Then Sleep 20 sec in case STREAM set to TRUE
    And Chandler STOP ONE_ON_ONE record_1 in context meetingID
    Then validate NOTIFY INFO for succeed stop is received after 5 sec for Chandler with messageIndex 1 and recordEnd: record.terminate
    Then validate NOTIFY INFO for exit stop is received after 5 sec for Chandler with messageIndex 2 and stopEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And Chandler TRANSFER ONE_ON_ONE record_1 in context meetingID
    Then validate NOTIFY INFO for succeed transfer is received after 5 sec for Chandler with messageIndex 3 and transferEnd: transfer.complete
    Then validate NOTIFY INFO for exit transfer is received after 5 sec for Chandler with messageIndex 4 and transferEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    Then destroy audio room with meetingId context for host Chandler

  @one-on-one
  @hold-resume-play
  @TMU-31684
  Scenario: one on one with hold resume and play anna, with changed ip on sdp
    Given System is running on MCU_HOME
    Then enable skip by environment
    Given create conference 880012
    Given caseType is WITH_RECORDING_HEADER
    When INVITE participant Monica with meetingId context and audio roomType
    And participant Monica send create conference INFO on audio room
    And JOIN participant Monica with meetingId context and roomType audio
    When INVITE participant Joey with meetingId context and audio roomType
    And JOIN participant Joey with meetingId context and roomType audio
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | Monica      | context   | audio    | audio1     |
      | Joey        | context   | audio    | audio1     |
    Then Sleep 10 sec in case STREAM set to TRUE
#    HOLD
    And Monica reInvite in audio-video roomType as sendonly
    And Joey reInvite in audio roomType as recvonly updatedIp 10.1.32.45
#    And Joey reInvite in audio roomType as recvonly-
#    PLAY ANNA
    And participant Joey send INFO with meetingID context with caseType DIAL_IN and infoType PLAY_AMT
    Then validate INFO is received after 5 sec for Monica with messageIndex 1 and name: moml.exit- play.amt: 3646 and play.end: play.complete
    Then validate INFO is received after 5 sec for Monica with messageIndex 2 and name: msml.dialog.exit-
    Then Sleep 5 sec in case STREAM set to TRUE
#    RESUME
    And Monica reInvite in audio-video roomType as sendrecv
    And Joey reInvite in audio-video roomType as sendrecv
    Then destroy audio room with meetingId context for host Monica

  @one-on-one
  @hold-resume-play
  @TMU-32141
  @MCU-2955
  Scenario: one on one with hold resume play anna and stop
    Given System is running on MCU_HOME
    Then enable skip by environment
    Given create conference 880012
    Given caseType is WITH_RECORDING_HEADER
    When INVITE participant Monica with meetingId context and audio roomType
    And participant Monica send create conference INFO on audio room
    And JOIN participant Monica with meetingId context and roomType audio
    When INVITE participant Joey with meetingId context and audio roomType
    And JOIN participant Joey with meetingId context and roomType audio
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | Monica      | context   | audio    | audio1     |
      | Joey        | context   | audio    | audio1     |
    Then Sleep 10 sec in case STREAM set to TRUE
   # HOLD
    And Monica reInvite in audio-video roomType as sendonly
    And Joey reInvite in audio roomType as recvonly
#    PLAY ANNA
    And participant Joey send INFO with meetingID context with caseType DIAL_IN and infoType PLAY_AMT
    And participant Joey send INFO with meetingID context with caseType DIAL_IN and infoType PLAY_END
    Then validate INFO is received after 5 sec for Monica with messageIndex 1 and name: moml.exit play.amt: <3646 and play.end: play.terminate
    Then validate INFO is received after 5 sec for Monica with messageIndex 2 and name: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
#    RESUME
    And Monica reInvite in audio-video roomType as sendrecv
    And Joey reInvite in audio-video roomType as sendrecv
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | Monica      | context   | audio    | audio1     |
      | Joey        | context   | audio    | audio1     |
    Then Sleep 10 sec in case STREAM set to TRUE
    And stop stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | Monica    | context   | audio    |
      | Joey        | context   | audio    |
    Then destroy audio room with meetingId context for host Monica

  @one-on-one
#  @nightly
  @recorder
  @play-stop
  @TMU-32181
  @MCU-2955
  Scenario: one on one recording play anna and stop
    Given System is running on MCU_HOME
    Then enable skip by environment
    Given create conference 880012
    Given caseType is WITH_RECORDING_HEADER
    When INVITE participant Monica with meetingId context and audio roomType
    And participant Monica send create conference INFO on audio room
    And JOIN participant Monica with meetingId context and roomType audio
    When INVITE participant Joey with meetingId context and audio roomType
    And JOIN participant Joey with meetingId context and roomType audio
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | Monica      | context   | audio    | audio1     |
      | Joey        | context   | audio    | audio1     |
    And Monica START ONE_ON_ONE record1 in context meetingID
    Then Sleep 20 sec in case STREAM set to TRUE
#    PLAY ANNA
    And participant Joey send INFO with meetingID context with caseType DIAL_IN and infoType PLAY_AMT
    And participant Joey send INFO with meetingID context with caseType DIAL_IN and infoType PLAY_END
    Then validate INFO is received after 5 sec for Monica with messageIndex 1 and name: moml.exit play.amt: <3646 and play.end: play.terminate
    Then validate INFO is received after 5 sec for Monica with messageIndex 2 and name: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And stop stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType |
      | Monica      | context   | audio    |
      | Joey        | context   | audio    |
    And Monica STOP ONE_ON_ONE record1 in context meetingID
    Then validate NOTIFY INFO for succeed stop is received after 5 sec for Monica with messageIndex 3 and recordEnd: record.terminate
    Then validate NOTIFY INFO for exit stop is received after 5 sec for Monica with messageIndex 4 and stopEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And Monica TRANSFER ONE_ON_ONE record1 in context meetingID
    Then validate NOTIFY INFO for succeed transfer is received after 5 sec for Monica with messageIndex 5 and transferEnd: transfer.complete
    Then validate NOTIFY INFO for exit transfer is received after 5 sec for Monica with messageIndex 6 and transferEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    Then destroy audio room with meetingId context for host Monica

#  @nightly
  @recorder
  @one-on-one
  @oneOnOne-hold-resume-switch-hold
  @TMU-31683
  Scenario: one on one recording with hold resume and play anna and hold switch ,upload to Mstore replacment
    Given System is running on MCU_HOME
    Then enable skip by environment
    Given create conference 880013
    Given caseType is WITH_RECORDING_HEADER
    When INVITE participant Monica with meetingId context and audio roomType
    And participant Monica send create conference INFO on audio room
    And JOIN participant Monica with meetingId context and roomType audio
    When INVITE participant Joey with meetingId context and audio roomType
    And JOIN participant Joey with meetingId context and roomType audio
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | Monica      | context   | audio    | audio1     |
      | Joey        | context   | audio    | audio5     |
    And Monica START ONE_ON_ONE record_1 in context meetingID
    Then Sleep 10 sec in case STREAM set to TRUE
#    HOLD
    And Monica reInvite in audio-video roomType as sendonly
    And Joey reInvite in audio roomType as recvonly
    And Monica STOP ONE_ON_ONE record_1 in context meetingID
    Then validate NOTIFY INFO for succeed stop is received after 5 sec for Monica with messageIndex 1 and recordEnd: record.terminate
    Then validate NOTIFY INFO for exit stop is received after 5 sec for Monica with messageIndex 2 and stopEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And participant Joey send INFO with meetingID context with caseType DIAL_IN and infoType PLAY_AMT
    Then validate INFO is received after 5 sec for Monica with messageIndex 3 and name: moml.exit play.amt: 3646 and play.end: play.complete
    Then validate INFO is received after 5 sec for Monica with messageIndex 4 and name: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And Monica START ONE_ON_ONE record_1 in context meetingID
    Then Sleep 10 sec in case STREAM set to TRUE
    #RESUME
    And Monica reInvite in audio-video roomType as sendrecv
    And Joey reInvite in audio roomType as sendrecv
    #HOLD
    And Joey reInvite in audio roomType as sendonly
    And Monica reInvite in audio-video roomType as recvonly
    And Monica STOP ONE_ON_ONE record1 in context meetingID
    Then validate NOTIFY INFO for succeed stop is received after 5 sec for Monica with messageIndex 5 and recordEnd: record.terminate
    Then validate NOTIFY INFO for exit stop is received after 5 sec for Monica with messageIndex 6 and stopEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And participant Monica send INFO with meetingID context with caseType DIAL_IN and infoType PLAY_AMT
    Then validate INFO is received after 5 sec for Monica with messageIndex 7 and name: moml.exit play.amt: 3646 and play.end: play.complete
    Then validate INFO is received after 5 sec for Monica with messageIndex 8 and name: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    #RESUME
    And Monica reInvite in audio-video roomType as sendrecv
    And Joey reInvite in audio roomType as sendrecv
    And Monica TRANSFER ONE_ON_ONE record_1 in context meetingID
    Then validate NOTIFY INFO for succeed transfer is received after 10 sec for Monica with messageIndex 9 and transferEnd: transfer.complete
    Then validate NOTIFY INFO for exit transfer is received after 10 sec for Monica with messageIndex 10 and transferEnd: msml.dialog.exit
    Then Sleep 10 sec in case STREAM set to TRUE
    Then destroy audio room with meetingId context for host Monica

  @one-on-one
  @hold-resume-switch-hold
  @TMU-31682
  Scenario: one on one with hold resume and play anna and hold switch ,upload to Mstore replacment
    Given System is running on MCU_HOME
    Then enable skip by environment
    Given create conference 880014
    Given caseType is WITH_RECORDING_HEADER
    When INVITE participant Monica with meetingId context and audio roomType
    And participant Monica send create conference INFO on audio room
    And JOIN participant Monica with meetingId context and roomType audio
    When INVITE participant Joey with meetingId context and audio roomType
    And JOIN participant Joey with meetingId context and roomType audio
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | Monica      | context   | audio    | audio1     |
      | Joey        | context   | audio    | audio5     |
    Then Sleep 10 sec in case STREAM set to TRUE
#    HOLD
    And Monica reInvite in audio-video roomType as sendonly
    And Joey reInvite in audio roomType as recvonly
    And participant Joey send INFO with meetingID context with caseType DIAL_IN and infoType PLAY_AMT
    Then validate INFO is received after 5 sec for Monica with messageIndex 1 and name: moml.exit play.amt: 3646 and play.end: play.complete
    Then validate INFO is received after 5 sec for Monica with messageIndex 2 and name: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    #RESUME
    And Monica reInvite in audio-video roomType as sendrecv
    And Joey reInvite in audio roomType as sendrecv
    #HOLD
    And Joey reInvite in audio roomType as sendonly
    And Monica reInvite in audio-video roomType as recvonly
    And participant Monica send INFO with meetingID context with caseType DIAL_IN and infoType PLAY_AMT
    Then validate INFO is received after 5 sec for Monica with messageIndex 3 and name: moml.exit play.amt: 3646 and play.end: play.complete
    Then validate INFO is received after 5 sec for Monica with messageIndex 4 and name: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    #RESUME
    And Monica reInvite in audio-video roomType as sendrecv
    And Joey reInvite in audio roomType as sendrecv
    Then destroy audio room with meetingId context for host Monica

  @recorder
  @one-on-one
  @TEMP-TEST
  Scenario: one on one recording, upload to Mstore replacment with full lile path
    Given System is running on MCU_HOME
    Then enable skip by environment
    Given create conference 880015
    Given caseType is WITH_RECORDING_HEADER
    When INVITE participant Chandler with meetingId context and audio roomType
    And participant Chandler send create conference INFO on audio room
    And JOIN participant Chandler with meetingId context and roomType audio
    When INVITE participant Ross with meetingId context and audio roomType
    And JOIN participant Ross with meetingId context and roomType audio
    And start stream in case STREAM set to TRUE:
      | Participant | meetingID | roomType | streamFile |
      | Chandler    | context   | audio    | audio1     |
      | Ross        | context   | audio    | audio3     |
    And Chandler START ONE_ON_ONE record1 in context meetingID
    Then Sleep 20 sec in case STREAM set to TRUE
    And Chandler STOP ONE_ON_ONE record1 in context meetingID
    Then validate NOTIFY INFO for succeed stop is received after 5 sec for Chandler with messageIndex 1 and recordEnd: record.terminate
    Then validate NOTIFY INFO for exit stop is received after 5 sec for Chandler with messageIndex 2 and stopEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And Chandler TRANSFER_FULL_PATH ONE_ON_ONE record1 in context meetingID
    Then validate NOTIFY INFO for succeed transfer is received after 5 sec for Chandler with messageIndex 3 and transferEnd: transfer.complete
    Then validate NOTIFY INFO for exit transfer is received after 5 sec for Chandler with messageIndex 4 and transferEnd: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    Then destroy audio room with meetingId context for host Chandler

  @one-on-one
  @codecs
  @TMU-32565
  Scenario: resume in one on one session with new codec list when old codec is in new list
    Given System is running on MCU_HOME
    Then enable skip by environment
    Given create conference 880016
    Given caseType is WITH_RECORDING_HEADER
    When INVITE participant Monica with meetingId context and audio roomType with codecListInput G722 server selects G722
    And participant Monica send create conference INFO on audio room
    And JOIN participant Monica with meetingId context and roomType audio
    When INVITE participant Joey with meetingId context and audio roomType with codecListInput G722 server selects G722
    And JOIN participant Joey with meetingId context and roomType audio
   # HOLD
    And Monica reInvite in audio-video roomType as sendonly
    And Joey reInvite in audio roomType as recvonly
#    RESUME
    And Monica reInvite in audio-video roomType as sendrecv with codecListInput AMR-WB,AMR,PCMU,PCMA,G729,G722,OPUS server selects G722
    And Joey reInvite in audio-video roomType as sendrecv
    Then destroy audio room with meetingId context for host Monica

  @one-on-one
  @codecs
  @TMU-32566
  Scenario: hold in one on one session with new codec list when old codec is not in new list the play and stop play
    Given System is running on MCU_HOME
    Then enable skip by environment
    Given create conference 880017
    Given caseType is WITH_RECORDING_HEADER
    When INVITE participant Monica with meetingId context and audio roomType with codecListInput G722 server selects G722
    And participant Monica send create conference INFO on audio room
    And JOIN participant Monica with meetingId context and roomType audio
    When INVITE participant Joey with meetingId context and audio roomType with codecListInput G722 server selects G722
    And JOIN participant Joey with meetingId context and roomType audio
   # HOLD
    And Joey reInvite in audio-video roomType as sendonly
    And Monica reInvite in audio roomType as recvonly with codecListInput AMR-WB,AMR,PCMU,PCMA,G729,OPUS server selects OPUS
#    RESUME
    And Monica reInvite in audio-video roomType as sendrecv
    And Joey reInvite in audio-video roomType as sendrecv
    And participant Monica send INFO with meetingID context with caseType DIAL_IN and infoType PLAY_AMT
    And participant Monica send INFO with meetingID context with caseType DIAL_IN and infoType PLAY_END
    Then validate INFO is received after 5 sec for Monica with messageIndex 1 and name: moml.exit play.amt: <3646 and play.end: play.terminate
    Then validate INFO is received after 5 sec for Monica with messageIndex 2 and name: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    And participant Joey send INFO with meetingID context with caseType DIAL_IN and infoType PLAY_AMT
    And participant Joey send INFO with meetingID context with caseType DIAL_IN and infoType PLAY_END
    Then validate INFO is received after 5 sec for Monica with messageIndex 3 and name: moml.exit play.amt: <3646 and play.end: play.terminate
    Then validate INFO is received after 5 sec for Monica with messageIndex 4 and name: msml.dialog.exit
    Then Sleep 5 sec in case STREAM set to TRUE
    Then destroy audio room with meetingId context for host Monica

